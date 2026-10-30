# -*- coding: utf-8 -*-
"""通用 POI 数据客户端：地理编码 / 逆地理 / 文本与周边检索 / 步行与驾车路径。

依赖：Python 3 stdlib（无需第三方包）。
Key 处理：本技能不内置任何凭证，必须通过环境变量 AMAP_KEY 提供高德 Web 服务 Key。
环境变量：
  AMAP_KEY        必填，高德 Web 服务 Key。
  AMAP_CACHE_DIR  可选，缓存目录；默认 ~/.codex/cache/amap。建议设为任务目录以便复跑与迁移。

用法示例：
  from amap_client import around_all, geocode, regeo, walking_route
  geos = geocode("昆山市珠江中路199号", city="昆山")
  pois, count = around_all("120.972781,31.375430", radius=1500, types="120200")
  route = walking_route("120.972781,31.375430", "120.973000,31.376000")

接口响应按参数写入本地缓存（JSON），相同参数不会重复扣配额。
"""

import json
import os
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE = "https://restapi.amap.com/v3"
DEFAULT_CACHE_DIR = os.path.join(
    os.path.expanduser("~"), ".codex", "cache", "amap"
)
_LAST_CALL = [0.0]


def _get_key():
    key = os.environ.get("AMAP_KEY") or os.environ.get("AMAP_EMBEDDED_KEY")
    if not key:
        raise RuntimeError(
            "缺少高德 Web 服务 Key：请设置环境变量 AMAP_KEY 后重试"
        )
    return key


def _cache_dir():
    return os.environ.get("AMAP_CACHE_DIR") or DEFAULT_CACHE_DIR


def _cache_path(path, params):
    safe = path.strip("/").replace("/", "_")
    q = urlencode(sorted((k, str(v)) for k, v in params.items() if k != "key"))
    if len(q) > 180:
        q = q[:170] + "_" + str(hash(q) % 100000)
    return os.path.join(_cache_dir(), f"{safe}__{q}.json")


def api_get(path, params, cache=True):
    """调用 Web 服务接口并缓存。参数不含 key（自动补充）。"""
    params = {k: v for k, v in params.items() if v is not None and v != ""}
    params["key"] = _get_key()
    params["output"] = "json"
    cpath = _cache_path(path, params) if cache else None
    if cpath and os.path.exists(cpath):
        with open(cpath, encoding="utf-8") as fh:
            return json.load(fh)

    url = f"{BASE}/{path}?" + urlencode(params)
    last_err = None
    for attempt in range(3):
        elapsed = time.time() - _LAST_CALL[0]
        if elapsed < 0.4:
            time.sleep(0.4 - elapsed)
        try:
            req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            _LAST_CALL[0] = time.time()
            if str(data.get("status")) != "1":
                code = data.get("infocode")
                if code in ("10008", "10009"):
                    raise RuntimeError(f"QPS/并发限制 infocode={code}")
                raise RuntimeError(
                    f"接口返回错误 infocode={code} info={data.get('info')} path={path}"
                )
            if cpath:
                os.makedirs(os.path.dirname(cpath), exist_ok=True)
                tmp = cpath + ".tmp"
                with open(tmp, "w", encoding="utf-8") as fh:
                    json.dump(data, fh, ensure_ascii=False)
                os.replace(tmp, cpath)
            return data
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            if isinstance(exc, RuntimeError) and "QPS" not in str(exc):
                raise
            time.sleep(1.0 * (attempt + 1))
    raise RuntimeError(f"接口连续失败: {last_err} path={path}")


def geocode(address, city=None):
    params = {"address": address}
    if city:
        params["city"] = city
    data = api_get("geocode/geo", params)
    geos = data.get("geocodes") or []
    if not geos:
        raise RuntimeError(f"地理编码无结果: {address}")
    return geos[0]


def regeo(location):
    return api_get("geocode/regeo", {"location": location}).get("regeocode") or {}


def text_search(keywords, city=None, page=1, offset=25, types=None):
    params = {
        "keywords": keywords,
        "page": page,
        "offset": offset,
        "types": types,
    }
    if city:
        params.update({"city": city, "citylimit": "true"})
    return api_get("place/text", params)


def around(
    location,
    radius=1000,
    keywords=None,
    types=None,
    page=1,
    offset=25,
    extensions="base",
    sortrule="distance",
):
    return api_get(
        "place/around",
        {
            "location": location,
            "radius": radius,
            "keywords": keywords,
            "types": types,
            "page": page,
            "offset": offset,
            "extensions": extensions,
            "sortrule": sortrule,
        },
    )


def around_all(
    location,
    radius=1000,
    keywords=None,
    types=None,
    max_pages=8,
    offset=25,
    extensions="base",
):
    """翻页聚合周边 POI（按 名称+坐标+类型 去重）。返回 (pois, 接口报告总数)。"""
    pois, seen = [], set()
    total_count = None
    for page in range(1, max_pages + 1):
        data = around(
            location,
            radius=radius,
            keywords=keywords,
            types=types,
            page=page,
            offset=offset,
            extensions=extensions,
        )
        total_count = data.get("count") or total_count
        batch = data.get("pois") or []
        new = 0
        for poi in batch:
            uid = (poi.get("name"), poi.get("location"), poi.get("typecode"))
            if uid not in seen:
                seen.add(uid)
                pois.append(poi)
                new += 1
        if not batch or len(batch) < offset:
            break
        if new == 0:
            break
    return pois, total_count


def _route(mode, origin, destination):
    data = api_get(
        f"direction/{mode}",
        {"origin": origin, "destination": destination, "extensions": "base"},
    )
    paths = (data.get("route") or {}).get("paths") or []
    if not paths:
        return None
    p = paths[0]
    return {
        "distance_m": float(p.get("distance", 0)),
        "duration_s": float(p.get("duration", 0)),
    }


def walking_route(origin, destination):
    return _route("walking", origin, destination)


def driving_route(origin, destination):
    return _route("driving", origin, destination)
