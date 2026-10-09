-- ============================================================
-- 矿山设备监控系统：为「故障发生日期」新增字段
-- 使用方式：打开 Supabase 控制台 → 左侧 SQL Editor → 粘贴执行（只需执行一次）
-- 项目：https://jplfmdvnaadaygbohbab.supabase.co
-- ============================================================

-- 故障发生日期（区别于 created_at「录入时间」）
-- 例：故障描述写作 "2026.9.1空压机叶片断裂"，页面会自动解析出 2026-09-01 存入此列
ALTER TABLE public.faults ADD COLUMN IF NOT EXISTS occurred_at timestamptz;

COMMENT ON COLUMN public.faults.occurred_at IS '故障发生日期（与 created_at 录入时间区分）';

-- 说明：
-- 1) 已有 RLS 策略作用于整行，新增列无需另配策略。
-- 2) 未执行本脚本前，页面端「发生日期」仍可正常填写与显示（存本机），
--    但不会写入云端；同步代码已做容错，不会因此中断。
-- 3) 执行后，页面下次自动同步（10 秒一次）即会把发生日期写入云端。
