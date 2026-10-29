import { SessionStore } from "./session-store.js";
export class PlatformApiError extends Error {
    code;
    httpStatus;
    constructor(message, options = {}) {
        super(message);
        this.name = "PlatformApiError";
        this.code = options.code;
        this.httpStatus = options.httpStatus;
    }
}
export class RobotPlatformClient {
    #baseUrl;
    #timeoutMs;
    #sessionStore;
    #fetch;
    constructor(config, options = {}) {
        this.#baseUrl = config.baseUrl.replace(/\/+$/, "");
        this.#timeoutMs = config.requestTimeoutMs;
        this.#sessionStore = options.sessionStore ?? new SessionStore(config);
        this.#fetch = options.fetchImpl ?? fetch;
    }
    async listProjects(input) {
        return this.#post("/webbff/v1/workspace/listWorkspaces", {
            pageNumber: input.pageNumber ?? 1,
            pageSize: input.pageSize ?? 100,
            filter: input.workspaceNo || input.workspaceName
                ? {
                    workspaceNo: input.workspaceNo,
                    workspaceName: input.workspaceName,
                }
                : undefined,
        });
    }
    async listRobots(input) {
        return this.#post("/webbff/v1/robot/list", {
            pageNumber: input.pageNumber ?? 1,
            pageSize: input.pageSize ?? 100,
            measureType: input.measureType ?? 1,
            orderBy: input.orderBy ?? "completeness desc",
            filter: input.filter ?? {},
        });
    }
    async getRobot(robotSn) {
        return this.#post("/webbff/v1/robot/detail", { robotSn });
    }
    async getRealtimeOverview(filter = {}) {
        return this.#post("/webbff/v1/homePage/getRealtimeOverview", { filter });
    }
    async listRobotTaskStatistics(input) {
        return this.#post("/webbff/v1/homePage/listRobotTaskStatistics", {
            pageNumber: input.pageNumber ?? 1,
            pageSize: input.pageSize ?? 100,
            startDate: input.startDate,
            endDate: input.endDate,
            measureType: input.measureType ?? 1,
            filter: input.filter ?? {},
            currentViewDate: input.currentViewDate ?? input.endDate,
            isCompliant: input.isCompliant,
            orderBy: input.orderBy ?? "completeness desc",
        });
    }
    async getRobotTaskSummary(input) {
        return this.#post("/webbff/v1/task/viewTaskPanelByRobotSn", {
            robotSn: input.robotSn,
            startDate: input.startDate,
            endDate: input.endDate,
            measureType: input.measureType ?? 1,
        });
    }
    async listRobotDailyTasks(input) {
        return this.#post("/webbff/v1/task/listCleaningDailyTasks", {
            robotSn: input.robotSn,
            date: input.date,
            measureType: input.measureType ?? 1,
        });
    }
    async getRobotCalendar(input) {
        return this.#post("/webbff/v1/task/viewCleaningCalendarByRobotSn", {
            robotSn: input.robotSn,
            yearMonth: input.yearMonth,
            measureType: input.measureType ?? 1,
        });
    }
    async getTaskThresholds(measureType = 1) {
        return this.#post("/webbff/v1/accountTaskCriteria/get", { measureType });
    }
    async listRobotAlerts(input) {
        const path = input.history
            ? "/incident/v1/incidentHistory/distPlatform/listByRobotSn"
            : "/incident/v1/incidentLatest/distPlatform/listByRobotSn";
        return this.#post(path, {
            robotSn: input.robotSn,
            pageNumber: input.pageNumber ?? 1,
            pageSize: input.pageSize ?? 20,
            filter: input.filter ?? {},
            languageCode: input.languageCode ?? "zh-CN",
        });
    }
    async #post(endpoint, body) {
        let session = await this.#sessionStore.load();
        let response = await this.#send(endpoint, body, session);
        if (response.status === 401) {
            session = await this.#refresh(session);
            response = await this.#send(endpoint, body, session);
        }
        const text = await response.text();
        let payload;
        try {
            payload = text ? JSON.parse(text) : {};
        }
        catch {
            throw new PlatformApiError(`平台返回了非 JSON 响应（HTTP ${response.status}）`, { httpStatus: response.status });
        }
        if (!response.ok) {
            throw new PlatformApiError(`平台请求失败（HTTP ${response.status}）`, { httpStatus: response.status });
        }
        if (payload &&
            typeof payload === "object" &&
            "code" in payload &&
            payload.code !== 0 &&
            payload.code !== 200 &&
            payload.code !== null) {
            throw new PlatformApiError(payload.message ?? payload.msg ?? "平台业务请求失败", { code: payload.code, httpStatus: response.status });
        }
        if (payload &&
            typeof payload === "object" &&
            "data" in payload) {
            return payload.data;
        }
        return payload;
    }
    async #send(endpoint, body, session) {
        return this.#fetch(`${this.#baseUrl}${endpoint}`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${session.accessToken}`,
                "Content-Type": "application/json",
                Origin: this.#baseUrl,
                Referer: `${this.#baseUrl}/`,
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(this.#timeoutMs),
        });
    }
    async #refresh(current) {
        if (!current.refreshToken) {
            throw new PlatformApiError("登录已过期且没有 refreshToken，请重新运行 npm run auth", { httpStatus: 401 });
        }
        const response = await this.#fetch(`${this.#baseUrl}/gas/api/v1alpha1/auth/token`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Origin: this.#baseUrl,
                Referer: `${this.#baseUrl}/`,
            },
            body: JSON.stringify({ refreshToken: current.refreshToken }),
            signal: AbortSignal.timeout(this.#timeoutMs),
        });
        const text = await response.text();
        const payload = text
            ? JSON.parse(text)
            : {};
        if (!response.ok || !payload.data?.accessToken) {
            throw new PlatformApiError("登录刷新失败，请重新运行 npm run auth", { httpStatus: response.status, code: payload.code });
        }
        const next = {
            accessToken: payload.data.accessToken,
            refreshToken: payload.data.refreshToken ?? current.refreshToken,
            updatedAt: new Date().toISOString(),
        };
        await this.#sessionStore.save(next);
        return next;
    }
}
//# sourceMappingURL=platform-client.js.map