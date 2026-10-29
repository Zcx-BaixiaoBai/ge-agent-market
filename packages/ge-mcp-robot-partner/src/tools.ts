import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { RobotPlatformClient } from "./platform-client.js";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD");
const yearMonthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "月份格式必须为 YYYY-MM");
const measureTypeSchema = z
  .union([z.literal(1), z.literal(2)])
  .describe("1=平方米，2=平方英尺");
const filterSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .describe("平台原生筛选对象，原样透传；只读查询使用");

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

function jsonResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function validateDateRange(startDate: string, endDate: string) {
  if (startDate > endDate) {
    throw new Error("startDate 不能晚于 endDate");
  }
}

export function registerReadOnlyTools(
  server: McpServer,
  client: RobotPlatformClient,
) {
  server.registerTool(
    "robot_list_projects",
    {
      title: "列出项目",
      description:
        "查询当前合作伙伴账号可见的项目/工作空间。只读。",
      inputSchema: z.object({
        pageNumber: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
        workspaceNo: z.string().optional(),
        workspaceName: z.string().optional(),
      }),
      annotations: readOnlyAnnotations,
    },
    async (input) => jsonResult(await client.listProjects(input)),
  );

  server.registerTool(
    "robot_list_devices",
    {
      title: "列出设备",
      description:
        "分页查询机器人台账、在线状态、项目归属和完成率。只读。",
      inputSchema: z.object({
        pageNumber: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
        measureType: measureTypeSchema.optional(),
        orderBy: z.string().optional(),
        filter: filterSchema,
      }),
      annotations: readOnlyAnnotations,
    },
    async (input) => jsonResult(await client.listRobots(input)),
  );

  server.registerTool(
    "robot_get_device",
    {
      title: "读取设备详情",
      description: "按设备序列号查询单台机器人详情。只读。",
      inputSchema: z.object({
        robotSn: z.string().min(1),
      }),
      annotations: readOnlyAnnotations,
    },
    async ({ robotSn }) => jsonResult(await client.getRobot(robotSn)),
  );

  server.registerTool(
    "robot_get_overview",
    {
      title: "读取实时概览",
      description:
        "查询设备总数、在线数量、任务中数量、离线数量等实时概览。只读。",
      inputSchema: z.object({
        filter: filterSchema,
      }),
      annotations: readOnlyAnnotations,
    },
    async ({ filter }) => jsonResult(await client.getRealtimeOverview(filter)),
  );

  server.registerTool(
    "robot_list_task_statistics",
    {
      title: "查询全量设备任务统计",
      description:
        "按日期分页查询设备的日任务统计，适合项目汇总和批量分析。只读。",
      inputSchema: z.object({
        startDate: dateSchema,
        endDate: dateSchema,
        pageNumber: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
        measureType: measureTypeSchema.optional(),
        currentViewDate: dateSchema.optional(),
        filter: filterSchema,
        isCompliant: z.boolean().optional(),
        orderBy: z.string().optional(),
      }),
      annotations: readOnlyAnnotations,
    },
    async (input) => {
      validateDateRange(input.startDate, input.endDate);
      return jsonResult(await client.listRobotTaskStatistics(input));
    },
  );

  server.registerTool(
    "robot_get_task_summary",
    {
      title: "读取设备任务汇总",
      description:
        "查询单台设备指定日期范围内的面积、工时、效率和完成率汇总。只读。",
      inputSchema: z.object({
        robotSn: z.string().min(1),
        startDate: dateSchema,
        endDate: dateSchema,
        measureType: measureTypeSchema.optional(),
      }),
      annotations: readOnlyAnnotations,
    },
    async (input) => {
      validateDateRange(input.startDate, input.endDate);
      return jsonResult(await client.getRobotTaskSummary(input));
    },
  );

  server.registerTool(
    "robot_list_daily_tasks",
    {
      title: "列出设备单日任务",
      description:
        "查询单台设备某一天的任务明细，包括清洁模式、面积、工时、完成率和状态。只读。",
      inputSchema: z.object({
        robotSn: z.string().min(1),
        date: dateSchema,
        measureType: measureTypeSchema.optional(),
      }),
      annotations: readOnlyAnnotations,
    },
    async (input) => jsonResult(await client.listRobotDailyTasks(input)),
  );

  server.registerTool(
    "robot_get_task_calendar",
    {
      title: "读取设备任务日历",
      description:
        "查询单台设备指定月份的任务和达标日历。只读。",
      inputSchema: z.object({
        robotSn: z.string().min(1),
        yearMonth: yearMonthSchema,
        measureType: measureTypeSchema.optional(),
      }),
      annotations: readOnlyAnnotations,
    },
    async (input) => jsonResult(await client.getRobotCalendar(input)),
  );

  server.registerTool(
    "robot_get_thresholds",
    {
      title: "读取达标阈值",
      description:
        "读取任务完成率、工作效率等达标阈值。只读。",
      inputSchema: z.object({
        measureType: measureTypeSchema.optional(),
      }),
      annotations: readOnlyAnnotations,
    },
    async ({ measureType }) =>
      jsonResult(await client.getTaskThresholds(measureType ?? 1)),
  );

  server.registerTool(
    "robot_list_alerts",
    {
      title: "列出设备告警",
      description:
        "查询单台机器人当前告警或历史告警，支持平台原生分页和筛选。只读。",
      inputSchema: z.object({
        robotSn: z.string().min(1),
        history: z.boolean().optional(),
        pageNumber: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
        filter: filterSchema,
        languageCode: z.string().optional(),
      }),
      annotations: readOnlyAnnotations,
    },
    async (input) => jsonResult(await client.listRobotAlerts(input)),
  );
}
