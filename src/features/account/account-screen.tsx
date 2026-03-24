"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  LogOut,
  RefreshCcw,
  Settings2,
  Trophy,
  UserRound,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ResultToast } from "@/components/result-toast";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { withBasePath } from "@/lib/base-path";
import { useLearningSummary } from "@/hooks/use-learning-summary";
import { CONTACT_EMAIL, OFFICIAL_WEBSITE_URL } from "@/lib/app-links";
import { releaseContentSummary } from "@/lib/content";
import { useAuthStore } from "@/stores/auth-store";
import { type StudyMode, useLearningStore } from "@/stores/learning-store";
import type { ContentSummary } from "@/types/content";

type UtilityPanel = "site" | "contact" | "terms" | "privacy" | "permissions" | null;
type FeedbackState = { text: string; positive: boolean };
type UtilitySection = { title: string; content: string };
type UtilityPanelContent = {
  title: string;
  description: string;
  value?: string;
  copySuccessMessage?: string;
  primaryActionLabel?: string;
  sections?: UtilitySection[];
};

const summaryData = releaseContentSummary as ContentSummary;
const DAILY_GOALS: Record<StudyMode, number> = { simple: 30, hard: 50 };

const MODE_OPTIONS = [
  {
    mode: "simple" as const,
    label: "\u7b80\u5355",
    badge: "\u8f7b\u91cf\u5b66\u4e60",
    description:
      "\u9002\u5408\u5feb\u901f\u8fdb\u5165\u72b6\u6001\uff0c\u4fdd\u6301\u6bcf\u5929\u7a33\u5b9a\u5b66\u4e60\u3002"
  },
  {
    mode: "hard" as const,
    label: "\u56f0\u96be",
    badge: "\u5f3a\u5316\u8bb0\u5fc6",
    description:
      "\u7ec3\u4e60\u66f4\u96c6\u4e2d\uff0c\u9002\u5408\u51b2\u523a\u548c\u5f3a\u5316\u8bb0\u5fc6\u3002"
  }
];

const LEARNING_ENTRIES = [
  {
    title: "\u5b66\u4e60\u7edf\u8ba1",
    href: "/stats",
    description:
      "\u67e5\u770b\u7d2f\u8ba1\u5b66\u4e60\u3001\u51c6\u786e\u7387\u548c\u9636\u6bb5\u8fdb\u5ea6\u3002"
  },
  {
    title: "\u6210\u5c31\u5fbd\u7ae0",
    href: "/achievements",
    description:
      "\u770b\u770b\u5df2\u7ecf\u89e3\u9501\u4e86\u54ea\u4e9b\u5b66\u4e60\u91cc\u7a0b\u7891\u3002"
  }
] as const;

const SUPPORT_ENTRIES = [
  {
    title: "\u7248\u672c\u65e5\u5fd7",
    href: "/version-log",
    description: "\u67e5\u770b\u6700\u8fd1\u7684\u66f4\u65b0\u5185\u5bb9\u3002"
  },
  {
    title: "\u5b98\u7f51",
    action: "site" as const,
    description: "\u6253\u5f00\u5b98\u65b9\u9875\u9762\u3002"
  },
  {
    title: "\u8054\u7cfb\u6211\u4eec",
    action: "contact" as const,
    description: "\u590d\u5236\u8054\u7cfb\u65b9\u5f0f\u3002"
  }
] as const;

const LEGAL_ENTRIES = [
  {
    title: "用户协议（核心七条）",
    action: "terms" as const,
    description: "查看账号、安全、内容使用与服务更新的七项核心约定。"
  },
  {
    title: "隐私政策",
    action: "privacy" as const,
    description: "说明学习数据、本地缓存和资料信息的处理方式。"
  },
  {
    title: "权限说明",
    action: "permissions" as const,
    description: "说明联网、文件选择、剪贴板和本地存储的用途。"
  }
] as const;

const UTILITY_PANEL_CONTENT: Record<Exclude<UtilityPanel, null>, UtilityPanelContent> = {
  site: {
    title: "打开官网",
    description: "可以复制官网链接，或直接在新窗口打开。",
    value: OFFICIAL_WEBSITE_URL,
    copySuccessMessage: "官网链接已复制",
    primaryActionLabel: "打开官网"
  },
  contact: {
    title: "联系我们",
    description: "可以复制联系邮箱，方便稍后联系。",
    value: CONTACT_EMAIL,
    copySuccessMessage: "联系方式已复制"
  },
  terms: {
    title: "用户协议（核心七条）",
    description: "以下内容为当前版本上架前草案。继续使用本产品，即视为你已阅读并同意以下核心条款。",
    sections: [
      {
        title: "第一条 适用范围",
        content:
          "本产品面向英语学习与自我训练场景提供单词、句子、阅读、测试和闯关等功能，不作为升学、考试、医疗、法律或其他专业决策依据。"
      },
      {
        title: "第二条 账号与安全",
        content:
          "你可使用本地账号保存学习进度、昵称和头像。请妥善保管账号密码，不要将设备或账号交由他人长期共用；因个人保管不当造成的数据泄露或误操作，需自行承担相应后果。"
      },
      {
        title: "第三条 正常使用边界",
        content:
          "你可以在个人学习范围内合理使用本产品内容，但不得以爬取、批量导出、逆向破解、恶意刷取、外挂脚本或其他非法方式破坏服务、复制资源或影响其他用户体验。"
      },
      {
        title: "第四条 内容与知识产权",
        content:
          "产品内的课程编排、页面设计、音频资源、题库结构和品牌标识，除依法允许或另有说明外，均受相关知识产权规则保护。未经授权，不得擅自复制、出售、再分发或用于商业培训。"
      },
      {
        title: "第五条 虚拟权益与后续功能",
        content:
          "商城展示的星芒、主题、音效、环境音乐等虚拟权益，仅用于产品内体验。若后续开放购买、兑换或会员能力，将以届时页面规则、订单说明和适用法律要求为准。"
      },
      {
        title: "第六条 服务中断与责任限制",
        content:
          "因系统维护、版本升级、网络故障、设备兼容性、不可抗力或第三方服务异常导致的短时中断、加载延迟、音频不可用或数据未及时同步，我们会尽力修复，但不对间接损失、期待收益损失承担保证责任。"
      },
      {
        title: "第七条 条款更新与联系",
        content:
          "当产品功能、运营主体信息、备案要求或法律监管规则发生变化时，我们可能更新本协议。重大调整会在版本日志、更多功能页或应用内提示中同步；你可通过页面展示的官网与联系邮箱反馈问题。"
      }
    ]
  },
  privacy: {
    title: "隐私政策",
    description: "以下内容为当前版本上架前草案，用于说明本产品如何处理你的学习数据与设备侧信息。",
    sections: [
      {
        title: "一、我们会处理哪些信息",
        content:
          "当前版本主要处理你主动输入或在本机生成的数据，包括本地账号名、密码摘要、昵称、头像、学习进度、题目记录、设置项、缓存音频以及你自行导入的自定义环境音乐。"
      },
      {
        title: "二、这些信息的用途",
        content:
          "上述信息主要用于保存学习状态、恢复上次进度、展示个人资料、控制页面设置、缓存朗读或音频资源，以及支持你在不同学习模块之间连续使用。"
      },
      {
        title: "三、存储方式与位置",
        content:
          "当前版本以本地存储为主：账号与学习进度保存在设备浏览器或 WebView 的本地存储中，缓存音频与自定义环境音乐保存在设备侧 IndexedDB 中。导入的头像和音频不会默认上传到公开服务器。"
      },
      {
        title: "四、网络访问与第三方",
        content:
          "应用会在需要时联网获取页面资源、音频文件或站点内容。除实现上述功能所必需的网络请求外，当前版本不以内置广告网络、通讯录采集或位置追踪为目的共享你的个人信息。"
      },
      {
        title: "五、你的控制权",
        content:
          "你可以修改昵称与头像、切换或退出本地账号、重置学习进度、清理缓存音频、删除自定义环境音乐。删除或重置后，相关本地数据将按功能逻辑从设备侧移除或覆盖。"
      },
      {
        title: "六、安全保护",
        content:
          "我们已将本地账号密码切换为摘要存储，不再直接以明文方式校验。尽管如此，设备遗失、系统被破解、浏览器环境异常或你主动共享设备时，仍可能存在数据风险，请结合设备锁屏和系统安全机制共同保护。"
      },
      {
        title: "七、未成年人、更新与联系",
        content:
          "若你是未成年人，建议在监护人指导下使用。本政策后续如因产品能力变化而更新，会在应用内同步展示；若你对隐私处理有疑问，可通过更多功能中的联系方式与我们沟通。"
      }
    ]
  },
  permissions: {
    title: "权限说明",
    description: "以下说明用于对齐上架审核和用户知情要求，解释当前版本实际使用到的设备能力。",
    sections: [
      {
        title: "1. 网络权限（INTERNET）",
        content:
          "Android 清单当前仅声明了网络权限，用于加载应用页面、获取在线音频、访问官网链接以及完成与资源相关的正常网络请求。"
      },
      {
        title: "2. 文件选择与本地导入",
        content:
          "更换头像、导入自定义环境音乐时，会由你主动触发系统文件选择器。当前版本不要求常驻相册、媒体库或外部存储读写权限，也不会在后台自动扫描你的设备文件。"
      },
      {
        title: "3. 剪贴板能力",
        content:
          "当你点击复制官网或联系方式时，系统会把对应文本写入剪贴板，仅用于你主动发起的复制操作，不会循环读取或持续监听剪贴板内容。"
      },
      {
        title: "4. 本地存储与缓存",
        content:
          "应用会在设备本地保存账号摘要、学习进度、设置项、缓存音频和你导入的自定义音频，以便下次继续学习并提升播放流畅度。"
      },
      {
        title: "5. 朗读与语音相关能力",
        content:
          "当前版本主要使用系统朗读或浏览器语音合成播放英文内容。设置页仅检测设备是否支持语音识别能力，并不会在当前版本中主动申请麦克风权限进行录音。"
      },
      {
        title: "6. 当前未声明的敏感权限",
        content:
          "当前 AndroidManifest 中未声明摄像头、麦克风、定位、通讯录、短信、通话记录、后台定位等敏感权限。如后续版本新增相关能力，我们会先更新说明，并在系统授权链路中明确征求你的同意。"
      }
    ]
  }
};

function copyText(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return Promise.resolve(false);
  }

  return navigator.clipboard.writeText(value).then(() => true).catch(() => false);
}

function describeLearningRoute(route: string | undefined, knownWords: number, completedPassages: number, reviewMistakes: number) {
  const safeRoute = route || "/vocabulary";

  if (safeRoute.startsWith("/reading")) {
    return { href: safeRoute, title: "\u9605\u8bfb\u6a21\u5757", hint: "\u7ee7\u7eed\u9605\u8bfb", subtitle: `\u5df2\u8bfb ${completedPassages} \u7bc7\u77ed\u6587` };
  }

  if (safeRoute.startsWith("/expressions")) {
    return { href: safeRoute, title: "\u8868\u8fbe\u6a21\u5757", hint: "\u7ee7\u7eed\u8868\u8fbe", subtitle: "\u7ee7\u7eed\u7ec3\u4e60\u9ad8\u9891\u8868\u8fbe" };
  }

  if (safeRoute.startsWith("/sentences")) {
    return { href: safeRoute, title: "\u53e5\u5b50\u6a21\u5757", hint: "\u7ee7\u7eed\u7ec3\u53e5\u5b50", subtitle: "\u7ee7\u7eed\u5b8c\u6210\u53e5\u578b\u8bad\u7ec3" };
  }

  if (safeRoute.startsWith("/review")) {
    return { href: safeRoute, title: "\u590d\u4e60\u6a21\u5757", hint: "\u53bb\u590d\u4e60", subtitle: reviewMistakes > 0 ? `\u8fd8\u6709 ${reviewMistakes} \u9879\u5f85\u590d\u4e60` : "\u590d\u4e60\u6c60\u5df2\u6e05\u7a7a" };
  }

  if (safeRoute.startsWith("/test")) {
    return { href: safeRoute, title: "\u6d4b\u8bd5\u6a21\u5757", hint: "\u7ee7\u7eed\u6d4b\u8bd5", subtitle: "\u7ee7\u7eed\u68c0\u6d4b\u5f53\u524d\u5b66\u4e60\u6548\u679c" };
  }

  return { href: safeRoute, title: "\u8bcd\u6c47\u6a21\u5757", hint: "\u7ee7\u7eed\u80cc\u8bcd", subtitle: `\u5df2\u638c\u63e1 ${knownWords} \u4e2a\u5355\u8bcd` };
}

function buildEncouragement(todayProgress: number, todayGoal: number, streakDays: number) {
  if (todayProgress >= todayGoal) {
    return "\u4eca\u5929\u76ee\u6807\u5df2\u5b8c\u6210\uff0c\u7ee7\u7eed\u4fdd\u6301\u8fd9\u4e2a\u8282\u594f\u3002";
  }
  const remaining = todayGoal - todayProgress;
  if (remaining <= 10) {
    return `\u518d\u5b66 ${remaining} \u4e2a\u5c31\u5b8c\u6210\u4eca\u65e5\u76ee\u6807\u3002`;
  }
  if (streakDays >= 7) {
    return `\u4f60\u5df2\u7ecf\u8fde\u7eed\u5b66\u4e60 ${streakDays} \u5929\u4e86\uff0c\u72b6\u6001\u5f88\u7a33\u3002`;
  }
  return "\u4eca\u5929\u4e5f\u5f88\u68d2\uff0c\u7ee7\u7eed\u5f80\u524d\u63a8\u8fdb\u4e00\u70b9\u70b9\u3002";
}

function buildAchievementPreview(knownWords: number, streakDays: number, completedPassages: number, reviewMistakes: number) {
  if (knownWords < 100) {
    return { title: "\u767e\u8bcd\u8d77\u6b65", description: "\u638c\u63e1 100 \u4e2a\u5355\u8bcd", progress: `${Math.min(knownWords, 100)} / 100` };
  }
  if (knownWords < 500) {
    return { title: "\u8bcd\u6c47\u8fdb\u9636", description: "\u638c\u63e1 500 \u4e2a\u5355\u8bcd", progress: `${Math.min(knownWords, 500)} / 500` };
  }
  if (streakDays < 7) {
    return { title: "\u4e03\u65e5\u8fde\u5b66", description: "\u8fde\u7eed\u5b66\u4e60 7 \u5929", progress: `${Math.min(streakDays, 7)} / 7` };
  }
  if (completedPassages < 30) {
    return { title: "\u9605\u8bfb\u7834\u51b0", description: "\u5b8c\u6210 30 \u7bc7\u77ed\u6587\u9605\u8bfb", progress: `${Math.min(completedPassages, 30)} / 30` };
  }
  return { title: "\u590d\u4e60\u6e05\u96f6", description: "\u5c06\u590d\u4e60\u6c60\u6574\u7406\u5230 0", progress: reviewMistakes === 0 ? "\u5df2\u5b8c\u6210" : `\u5269\u4f59 ${reviewMistakes} \u9879` };
}

export function AccountScreen() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [avatarDraft, setAvatarDraft] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [utilityPanel, setUtilityPanel] = useState<UtilityPanel>(null);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [switchTarget, setSwitchTarget] = useState<{ username: string; label: string } | null>(null);
  const [switchPassword, setSwitchPassword] = useState("");
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  const users = useAuthStore((state) => state.users);
  const currentUsername = useAuthStore((state) => state.currentUsername);
  const logout = useAuthStore((state) => state.logout);
  const switchAccount = useAuthStore((state) => state.switchAccount);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const activeMode = useLearningStore((state) => state.modeConfig.activeMode);
  const setActiveMode = useLearningStore((state) => state.setActiveMode);
  const lastVisitedTabs = useLearningStore((state) => state.userConfig.lastVisitedTabs);

  const summary = useLearningSummary(
    summaryData.totals.words,
    summaryData.totals.sentences,
    summaryData.totals.passages
  );

  const currentProfile = useMemo(
    () => users.find((user) => user.username === currentUsername),
    [currentUsername, users]
  );

  useEffect(() => {
    setNicknameDraft(currentProfile?.nickname || currentProfile?.username || "");
    setAvatarDraft(currentProfile?.avatarDataUrl || "");
  }, [currentProfile]);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timer = window.setTimeout(() => setFeedback(null), 2200);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const displayName = currentProfile?.nickname || currentUsername || "\u5b66\u4e60\u8005";
  const isLoggedIn = Boolean(currentUsername);
  const otherAccounts = users.filter((user) => user.username !== currentUsername);
  const nicknameBaseline = currentProfile?.nickname || currentProfile?.username || "";
  const avatarBaseline = currentProfile?.avatarDataUrl || "";
  const todayGoal = DAILY_GOALS[activeMode];
  const todayProgress = summary.todayWords + summary.todaySentences + summary.todayPassages;
  const progressPercent = Math.max(0, Math.min(100, Math.round((todayProgress / todayGoal) * 100)));
  const learningTarget = describeLearningRoute(
    lastVisitedTabs.basics,
    summary.knownWords,
    summary.completedPassages,
    summary.reviewMistakes
  );
  const encouragement = buildEncouragement(todayProgress, todayGoal, summary.streakDays);
  const achievement = buildAchievementPreview(
    summary.knownWords,
    summary.streakDays,
    summary.completedPassages,
    summary.reviewMistakes
  );
  const activeModeLabel = activeMode === "simple" ? "简单模式" : "困难模式";
  const todayTargetDescription =
    activeMode === "simple" ? "稳步推进 30 个学习单元" : "强化记忆 50 个学习单元";
  const liveDisplayName =
    profileEditorOpen
      ? nicknameDraft.trim() || currentProfile?.username || currentUsername || "\u5b66\u4e60\u8005"
      : displayName;
  const liveAvatarDataUrl = profileEditorOpen ? avatarDraft : avatarBaseline;
  const profileDraftChanged =
    nicknameDraft.trim() !== nicknameBaseline.trim() || avatarDraft !== avatarBaseline;
  const continuePath = withBasePath(learningTarget.href) ?? learningTarget.href;
  const homePath = withBasePath("/") ?? "/";
  const utilityContent = utilityPanel ? UTILITY_PANEL_CONTENT[utilityPanel] : null;
  const utilityPanelWide =
    utilityPanel === "terms" || utilityPanel === "privacy" || utilityPanel === "permissions";

  const pushFeedback = (text: string, positive = true) => setFeedback({ text, positive });

  const openProfileEditor = () => {
    setNicknameDraft(nicknameBaseline);
    setAvatarDraft(avatarBaseline);
    setProfileEditorOpen(true);
  };

  const closeProfileEditor = () => {
    setNicknameDraft(nicknameBaseline);
    setAvatarDraft(avatarBaseline);
    setProfileEditorOpen(false);
  };

  const saveProfile = () => {
    if (!isLoggedIn) return;
    const nextNickname = nicknameDraft.trim() || currentProfile?.username || "";
    updateProfile({ nickname: nextNickname, avatarDataUrl: avatarDraft });
    setNicknameDraft(nextNickname);
    setAvatarDraft(avatarDraft);
    setProfileEditorOpen(false);
    pushFeedback("\u6635\u79f0\u5df2\u4fdd\u5b58");
  };

  const resetProfile = () => {
    if (!isLoggedIn) return;
    const resetName = currentProfile?.username || "";
    setNicknameDraft(resetName);
    setAvatarDraft("");
    pushFeedback("\u5df2\u6062\u590d\u9ed8\u8ba4\u8d44\u6599\uff0c\u4fdd\u5b58\u540e\u751f\u6548");
  };

  const handleModeChange = (mode: StudyMode) => {
    setActiveMode(mode);
    const option = MODE_OPTIONS.find((item) => item.mode === mode);
    pushFeedback(`\u5df2\u5207\u6362\u5230${option?.label ?? "\u5f53\u524d"}\u6a21\u5f0f`);
  };

  const handleContinueLearning = () => {
    setIsContinuing(true);
    pushFeedback(`\u6b63\u5728\u8fdb\u5165${learningTarget.title}`);
    startTransition(() => router.push(continuePath));
  };

  const openSwitchAccount = (username: string) => {
    const target = users.find((user) => user.username === username);
    if (!target) {
      pushFeedback("未找到要切换的本地账号", false);
      return;
    }

    setSwitchPassword("");
    setSwitchTarget({
      username: target.username,
      label: target.nickname || target.username
    });
  };

  const closeSwitchAccount = () => {
    if (isSwitchingAccount) {
      return;
    }

    setSwitchTarget(null);
    setSwitchPassword("");
  };

  const handleSwitchAccount = async () => {
    if (!switchTarget) {
      return;
    }

    setIsSwitchingAccount(true);
    const result = await switchAccount(switchTarget.username, switchPassword);
    setIsSwitchingAccount(false);
    pushFeedback(result.message ?? (result.ok ? "已切换账号。" : "切换失败，请重试。"), result.ok);

    if (!result.ok) {
      return;
    }

    setSwitchTarget(null);
    setSwitchPassword("");
  };

  const handleCopy = async (value: string, successMessage: string) => {
    const copied = await copyText(value);
    pushFeedback(copied ? successMessage : "\u5f53\u524d\u73af\u5883\u4e0d\u652f\u6301\u590d\u5236\uff0c\u8bf7\u624b\u52a8\u590d\u5236", copied);
  };

  const handleLogout = () => {
    logout();
    setSwitchTarget(null);
    setSwitchPassword("");
    pushFeedback("已退出当前账号");
    startTransition(() => router.replace(homePath));
  };

  return (
    <Shell>
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string") {
                setAvatarDraft(reader.result);
                pushFeedback("\u65b0\u5934\u50cf\u5df2\u8f7d\u5165\uff0c\u4fdd\u5b58\u540e\u751f\u6548");
              }
            };
            reader.readAsDataURL(file);
            event.target.value = "";
          }}
        />

        <Card className="overflow-hidden rounded-[2rem] p-0">
          <div className="space-y-4 px-4 pb-4 pt-5 md:px-5 md:pb-5 md:pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  data-testid="account-avatar-button"
                  onClick={openProfileEditor}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-sky/15 ring-1 ring-white/70 transition hover:scale-[1.02]"
                  aria-label="\u66f4\u6362\u5934\u50cf"
                  disabled={!isLoggedIn}
                >
                  {liveAvatarDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={liveAvatarDataUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-500">
                      <Camera className="h-5 w-5" />
                      <span className="text-[10px] font-semibold">{"\u6362\u5934\u50cf"}</span>
                    </div>
                  )}
                </button>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-surge">Learning Hub</p>
                  <p className="truncate text-2xl font-black text-ink" data-testid="account-display-name">{liveDisplayName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {isLoggedIn
                      ? "\u5b66\u4e60\u63a7\u5236\u4e2d\u5fc3\u5df2\u51c6\u5907\u597d\uff0c\u7ee7\u7eed\u4eca\u5929\u7684\u8282\u594f\u3002"
                      : "\u5148\u4ece\u4eca\u5929\u7684\u5b66\u4e60\u76ee\u6807\u5f00\u59cb\uff0c\u968f\u65f6\u53ef\u4ee5\u8865\u5145\u8d44\u6599\u3002"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <div className="rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-sm font-semibold text-ink shadow-soft">
                  {`\u8fde\u7eed\u5b66\u4e60 ${summary.streakDays || 0} \u5929`}
                </div>
                <button
                  type="button"
                  onClick={openProfileEditor}
                  data-testid="account-open-profile-editor"
                  className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:text-ink"
                  disabled={!isLoggedIn}
                >
                  {"\u7f16\u8f91\u8d44\u6599"}
                </button>
              </div>
            </div>

          </div>
        </Card>

        <div className="rounded-[1.85rem] border border-white/75 bg-[linear-gradient(145deg,rgba(125,211,252,0.2),rgba(97,112,247,0.12),rgba(255,255,255,0.92))] px-4 py-4 shadow-[0_12px_36px_rgba(166,182,214,0.12)] md:px-5">
          <div className="space-y-3">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-600">{"今日学习进度"}</p>
                <span className="rounded-full bg-white/75 px-2.5 py-1 text-xs font-bold text-surge">{activeModeLabel}</span>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <p className="text-[2.35rem] font-black leading-none tracking-tight text-ink">{todayProgress}</p>
                <p className="pb-1 text-lg font-semibold text-slate-400">/ {todayGoal}</p>
              </div>

              <p className="text-sm leading-6 text-slate-600">{encouragement}</p>

              <div className="rounded-[1.2rem] border border-white/80 bg-white/76 px-3.5 py-3 shadow-soft">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{"今日目标"}</p>
                <p className="mt-1 text-lg font-black text-ink">{activeModeLabel}</p>
                <p className="mt-1 text-sm text-slate-500">{todayTargetDescription}</p>
              </div>
            </div>

            <ProgressBar value={progressPercent} className="mt-1" />

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1rem] bg-white/78 px-3 py-2.5 shadow-soft">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{"已掌握"}</p>
                <p className="mt-1 text-sm font-black text-ink">{summary.knownWords} 单词</p>
              </div>
              <div className="rounded-[1rem] bg-white/78 px-3 py-2.5 shadow-soft">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{"复习池"}</p>
                <p className="mt-1 text-sm font-black text-ink">{summary.reviewMistakes} 项</p>
              </div>
              <div className="rounded-[1rem] bg-white/78 px-3 py-2.5 shadow-soft">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{"最近学习"}</p>
                <p className="mt-1 text-sm font-black text-ink">{learningTarget.title}</p>
                <p className="text-[11px] text-slate-500">{learningTarget.subtitle}</p>
              </div>
              <div className="rounded-[1rem] bg-white/78 px-3 py-2.5 shadow-soft">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{"连续学习"}</p>
                <p className="mt-1 text-sm font-black text-ink">{summary.streakDays || 0} 天</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-[1.2rem] border border-white/80 bg-white/72 px-3.5 py-2.5 shadow-soft">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Trophy className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{`下一枚徽章：${achievement.title}`}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{`${achievement.description} · 当前进度 ${achievement.progress}`}</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-ink">{"\u7ee7\u7eed\u5b66\u4e60"}</p>
            <p className="text-sm text-slate-500">{`\u4ece${learningTarget.title}\u7ee7\u7eed\uff0c\u4fdd\u6301\u4eca\u5929\u7684\u5b66\u4e60\u8282\u594f\u3002`}</p>
          </div>
          <Button type="button" className="min-h-[3.75rem] w-full justify-between rounded-[1.5rem] px-5 text-base font-bold" onClick={handleContinueLearning}>
            <span className="flex items-center gap-2"><ArrowRight className="h-5 w-5" />{isContinuing ? "\u6b63\u5728\u8fdb\u5165..." : "\u7ee7\u7eed\u5b66\u4e60"}</span>
            <span className="text-sm font-semibold text-white/80">{learningTarget.hint}</span>
          </Button>
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-bold text-ink">{"\u5f53\u524d\u5b66\u4e60\u6a21\u5f0f"}</p>
              <p className="text-sm text-slate-500">{"\u76f4\u63a5\u5207\u6362\u5373\u53ef\u751f\u6548\uff0c\u5e2e\u52a9\u4f60\u8c03\u6574\u4eca\u5929\u7684\u5b66\u4e60\u5f3a\u5ea6\u3002"}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {MODE_OPTIONS.map((option) => {
                const active = option.mode === activeMode;
                return (
                  <button key={option.mode} type="button" data-testid={`account-mode-${option.mode}`} className={["rounded-[1.4rem] border px-4 py-4 text-left transition", active ? "border-surge/30 bg-[linear-gradient(145deg,rgba(97,112,247,0.15),rgba(125,211,252,0.18))] shadow-soft" : "border-white/70 bg-white/72 hover:-translate-y-0.5 hover:shadow-soft"].join(" ")} onClick={() => handleModeChange(option.mode)}>
                    <div className="flex items-center justify-between gap-3"><div><p className="text-lg font-black text-ink">{option.label}</p><p className="mt-1 text-sm font-semibold text-surge">{option.badge}</p></div>{active ? <div className="rounded-full bg-surge px-3 py-1 text-xs font-bold text-white">{"\u5f53\u524d"}</div> : null}</div>
                    <p className="mt-3 text-sm text-slate-500">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-ink">{"\u5b66\u4e60\u6570\u636e"}</p>
            <p className="text-sm text-slate-500">{"\u628a\u91cd\u70b9\u6570\u636e\u653e\u5728\u4e00\u8d77\uff0c\u65b9\u4fbf\u5feb\u901f\u5224\u65ad\u4eca\u5929\u7684\u72b6\u6001\u3002"}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.3rem] bg-[linear-gradient(145deg,rgba(125,211,252,0.2),rgba(255,255,255,0.82))] px-4 py-4"><p className="text-sm text-slate-500">{"\u4eca\u65e5\u5355\u8bcd"}</p><p className="mt-1 text-2xl font-black text-ink">{summary.todayWords}</p></div>
            <div className="rounded-[1.3rem] bg-[linear-gradient(145deg,rgba(167,214,140,0.18),rgba(255,255,255,0.82))] px-4 py-4"><p className="text-sm text-slate-500">{"\u4eca\u65e5\u53e5\u5b50"}</p><p className="mt-1 text-2xl font-black text-ink">{summary.todaySentences}</p></div>
            <div className="rounded-[1.3rem] bg-white/72 px-4 py-4"><p className="text-sm text-slate-500">{"\u5df2\u8bfb\u77ed\u6587"}</p><p className="mt-1 text-2xl font-black text-ink">{summary.completedPassages}</p></div>
            <div className="rounded-[1.3rem] bg-white/72 px-4 py-4"><p className="text-sm text-slate-500">{"\u8bcd\u6c47\u603b\u8fdb\u5ea6"}</p><p className="mt-1 text-2xl font-black text-ink">{summary.wordProgress}%</p></div>
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-ink">{"\u5b66\u4e60\u76f8\u5173"}</p>
              <p className="text-sm text-slate-500">{"\u548c\u5b66\u4e60\u53cd\u9988\u76f4\u63a5\u76f8\u5173\u7684\u5165\u53e3\u653e\u5728\u4e00\u8d77\u3002"}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {LEARNING_ENTRIES.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-[1.35rem] border border-white/70 bg-[linear-gradient(145deg,rgba(125,211,252,0.14),rgba(255,255,255,0.86))] px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft">
                  <p className="text-sm font-bold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-ink">{"\u5feb\u6377\u8bbe\u7f6e"}</p>
              <p className="text-sm text-slate-500">{"\u5934\u50cf\u548c\u6635\u79f0\u5df2\u79fb\u5230\u9876\u90e8\u7f16\u8f91\uff0c\u8fd9\u91cc\u4fdd\u7559\u5b66\u4e60\u504f\u597d\u8bbe\u7f6e\u5165\u53e3\u3002"}</p>
            </div>
            <Link href="/settings" className="rounded-[1.35rem] border border-white/70 bg-white/72 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"><Settings2 className="h-5 w-5" /></div>
                <div><p className="text-sm font-bold text-ink">{"\u8bbe\u7f6e"}</p><p className="mt-1 text-sm text-slate-500">{"\u8c03\u6574\u97f3\u6548\u3001\u4e3b\u9898\u548c\u5b66\u4e60\u504f\u597d\u3002"}</p></div>
              </div>
            </Link>
          </Card>
        </div>

        <Card className="space-y-4 bg-[linear-gradient(145deg,rgba(241,245,249,0.9),rgba(224,231,239,0.9))]">
          <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setShowMoreTools((value) => !value)}>
            <div><p className="text-sm font-bold text-ink">{"\u66f4\u591a\u529f\u80fd"}</p><p className="mt-1 text-sm text-slate-500">{"\u6536\u7eb3\u4f4e\u9891\u5165\u53e3\uff0c\u907f\u514d\u6253\u6270\u4e3b\u8981\u5b66\u4e60\u6d41\u7a0b\u3002"}</p></div>
            <div className="rounded-full bg-white/80 p-2 text-slate-500 shadow-soft">{showMoreTools ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>
          </button>
          <AnimatePresence initial={false}>
            {showMoreTools ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="grid gap-4 xl:grid-cols-[1fr_1fr_0.95fr]">
                <div className="space-y-3">
                  <p className="text-sm font-bold text-ink">{"\u7cfb\u7edf\u4e0e\u652f\u6301"}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {SUPPORT_ENTRIES.map((item) => "action" in item ? (
                      <button key={item.title} type="button" onClick={() => setUtilityPanel(item.action)} className="rounded-[1.3rem] border border-white/75 bg-white/80 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft"><p className="text-sm font-bold text-ink">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.description}</p></button>
                    ) : (
                      <Link key={item.href} href={item.href} className="rounded-[1.3rem] border border-white/75 bg-white/80 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft"><p className="text-sm font-bold text-ink">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.description}</p></Link>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-bold text-ink">{"协议与说明"}</p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {LEGAL_ENTRIES.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => setUtilityPanel(item.action)}
                        className="rounded-[1.3rem] border border-white/75 bg-[linear-gradient(145deg,rgba(224,231,255,0.78),rgba(255,255,255,0.92))] px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft"
                      >
                        <p className="text-sm font-bold text-ink">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-bold text-ink">{"\u8d26\u53f7\u7ba1\u7406"}</p>
                  {otherAccounts.length ? (
                    <div className="space-y-2 rounded-[1.35rem] border border-white/75 bg-white/80 p-3">
                      {otherAccounts.map((account) => (
                        <button
                          key={account.username}
                          type="button"
                          className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 text-left transition hover:bg-slate-100"
                          onClick={() => openSwitchAccount(account.username)}
                        >
                          <div>
                            <p className="text-sm font-semibold text-ink">{account.nickname || account.username}</p>
                            <p className="mt-1 text-xs text-slate-500">切换前需要验证该账号密码</p>
                          </div>
                          <UserRound className="h-4 w-4 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[1.35rem] border border-dashed border-white/75 bg-white/70 px-4 py-4 text-sm text-slate-500">
                      当前仅检测到一个本地账号，后续新增账号后可在这里安全切换。
                    </div>
                  )}
                  {otherAccounts.length ? (
                    <p className="rounded-[1.15rem] bg-white/70 px-3 py-2 text-xs leading-5 text-slate-500">
                      切换账号需要输入目标账号密码；旧版本账号首次验证通过后，会自动补全密码保护。
                    </p>
                  ) : null}
                  {isLoggedIn ? (
                    <Button type="button" variant="ghost" className="w-full justify-center rounded-[1.35rem]" onClick={handleLogout} data-testid="account-logout">
                      <LogOut className="mr-1 h-4 w-4" />
                      {"\u9000\u51fa\u5f53\u524d\u8d26\u53f7"}
                    </Button>
                  ) : (
                    <Link href="/" className="block">
                      <Button className="w-full rounded-[1.35rem]">{"\u524d\u5f80\u767b\u5f55 / \u6ce8\u518c"}</Button>
                    </Link>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Card>
      </div>

      <div className="pointer-events-none fixed inset-x-0 top-[calc(4.75rem+var(--safe-top-fallback))] z-[90] flex justify-center px-4">
        <ResultToast visible={Boolean(feedback)} correct={feedback?.positive ?? true} text={feedback?.text ?? ""} />
      </div>

      <AnimatePresence>
        {switchTarget ? (
          <motion.div
            className="fixed inset-0 z-[81] flex items-end justify-center bg-slate-900/22 px-4 pb-6 pt-20 md:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSwitchAccount}
          >
            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-[1.8rem] border border-white/75 bg-[linear-gradient(145deg,#f8fafc,#dce3ea)] p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-surge">账号切换</p>
                  <p className="mt-2 text-2xl font-black text-ink">{switchTarget.label}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    请输入该账号密码完成切换。旧版本账号首次验证后，会自动升级为摘要保护。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSwitchAccount}
                  className="rounded-2xl bg-white/75 p-2 text-slate-500 transition hover:text-ink"
                  aria-label="关闭账号切换"
                  disabled={isSwitchingAccount}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 rounded-[1.35rem] border border-white/80 bg-white/80 p-4 shadow-soft">
                <p className="text-sm font-bold text-ink">目标账号密码</p>
                <p className="mt-1 text-sm text-slate-500">至少输入 6 位密码；按回车也可以直接提交。</p>
                <input
                  data-testid="account-switch-password"
                  type="password"
                  value={switchPassword}
                  autoFocus
                  autoComplete="current-password"
                  onChange={(event) => setSwitchPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && switchPassword.trim().length >= 6 && !isSwitchingAccount) {
                      event.preventDefault();
                      void handleSwitchAccount();
                    }
                  }}
                  className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-surge"
                  placeholder="输入目标账号密码"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" className="flex-1 min-w-[8rem]" onClick={closeSwitchAccount} disabled={isSwitchingAccount}>
                  取消
                </Button>
                <Button
                  type="button"
                  className="flex-1 min-w-[8rem]"
                  onClick={() => {
                    void handleSwitchAccount();
                  }}
                  disabled={isSwitchingAccount || switchPassword.trim().length < 6}
                  data-testid="account-switch-confirm"
                >
                  {isSwitchingAccount ? "切换中..." : "验证并切换"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {profileEditorOpen ? (
          <motion.div
            className="fixed inset-0 z-[82] flex items-end justify-center bg-slate-900/22 px-4 pb-6 pt-20 md:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeProfileEditor}
          >
            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-lg rounded-[1.85rem] border border-white/75 bg-[linear-gradient(145deg,#f8fafc,#dce3ea)] p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-surge">{"\u8d44\u6599\u7f16\u8f91"}</p>
                  <p className="mt-2 text-2xl font-black text-ink">{"\u5934\u50cf\u4e0e\u6635\u79f0"}</p>
                  <p className="mt-1 text-sm text-slate-500">{"\u5728\u8fd9\u91cc\u4fee\u6539\u540e\uff0c\u9876\u90e8\u4f1a\u5b9e\u65f6\u9884\u89c8\uff0c\u4fdd\u5b58\u540e\u6b63\u5f0f\u751f\u6548\u3002"}</p>
                </div>
                <button
                  type="button"
                  onClick={closeProfileEditor}
                  className="rounded-2xl bg-white/75 p-2 text-slate-500 transition hover:text-ink"
                  aria-label="\u5173\u95ed\u8d44\u6599\u7f16\u8f91"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 rounded-[1.45rem] border border-white/80 bg-white/80 p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-sky/15 ring-1 ring-white/70 transition hover:scale-[1.02]"
                    aria-label="\u66f4\u6362\u5934\u50cf"
                  >
                    {avatarDraft ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarDraft} alt="avatar preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-500">
                        <Camera className="h-5 w-5" />
                        <span className="text-[10px] font-semibold">{"\u6362\u5934\u50cf"}</span>
                      </div>
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surge">{"Live Preview"}</p>
                    <p className="truncate text-2xl font-black text-ink">{nicknameDraft.trim() || currentProfile?.username || currentUsername || "\u5b66\u4e60\u8005"}</p>
                    <p className="mt-1 text-sm text-slate-500">{"\u5934\u50cf\u3001\u6635\u79f0\u4e0e\u9876\u90e8\u5c55\u793a\u4f1a\u4e00\u4e00\u5bf9\u5e94\u3002"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-[1.35rem] border border-white/80 bg-white/78 p-4 shadow-soft">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-ink">{"\u6635\u79f0"}</p>
                      <p className="mt-1 text-sm text-slate-500">{"\u7528\u4e8e\u9876\u90e8\u4e2a\u4eba\u6807\u8bc6\u548c\u5b66\u4e60\u8eab\u4efd\u5c55\u793a\u3002"}</p>
                    </div>
                    <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                      <Camera className="mr-2 h-4 w-4" />
                      {"\u66f4\u6362\u5934\u50cf"}
                    </Button>
                  </div>
                  <input
                    data-testid="account-nickname-input"
                    value={nicknameDraft}
                    onChange={(event) => setNicknameDraft(event.target.value)}
                    className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-surge"
                    placeholder="\u586b\u5199\u6635\u79f0"
                    disabled={!isLoggedIn}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    data-testid="account-save-profile"
                    onClick={saveProfile}
                    disabled={!isLoggedIn || !profileDraftChanged}
                    className="flex-1 min-w-[9rem]"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {"\u4fdd\u5b58\u8d44\u6599"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={resetProfile} disabled={!isLoggedIn} className="flex-1 min-w-[9rem]">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    {"\u6062\u590d\u9ed8\u8ba4"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {utilityContent ? (
          <motion.div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/22 px-4 pb-6 pt-20 md:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setUtilityPanel(null)}>
            <motion.div initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }} transition={{ duration: 0.18 }} onClick={(event) => event.stopPropagation()} className={`w-full ${utilityPanelWide ? "max-w-2xl" : "max-w-md"} rounded-[1.75rem] border border-white/75 bg-[linear-gradient(145deg,#f7f9fb,#d8dde4)] p-5 shadow-soft`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-ink">{utilityContent.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{utilityContent.description}</p>
                </div>
                <button type="button" onClick={() => setUtilityPanel(null)} className="rounded-2xl bg-white/75 p-2 text-slate-500 transition hover:text-ink" aria-label="\u5173\u95ed"><X className="h-4 w-4" /></button>
              </div>

              {utilityContent.value ? (
                <div className="mt-4 rounded-3xl bg-white/82 px-4 py-4">
                  <p className="break-all text-sm leading-6 text-ink">{utilityContent.value}</p>
                </div>
              ) : null}

              {utilityContent.sections?.length ? (
                <div className="mt-4 max-h-[min(58vh,34rem)] space-y-3 overflow-y-auto pr-1">
                  {utilityContent.sections.map((section) => (
                    <div key={section.title} className="rounded-[1.3rem] border border-white/80 bg-white/82 px-4 py-4">
                      <p className="text-sm font-bold text-ink">{section.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{section.content}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {utilityContent.value ? (
                  <Button type="button" variant="secondary" onClick={() => handleCopy(utilityContent.value!, utilityContent.copySuccessMessage ?? "已复制")}>
                    <Copy className="mr-2 h-4 w-4" />
                    {"\u590d\u5236"}
                  </Button>
                ) : null}
                {utilityPanel === "site" ? (
                  <Button type="button" onClick={() => { window.open(OFFICIAL_WEBSITE_URL, "_blank", "noopener,noreferrer"); pushFeedback("\u5b98\u7f51\u5df2\u5728\u65b0\u7a97\u53e3\u6253\u5f00"); }}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {utilityContent.primaryActionLabel ?? "\u6253\u5f00\u5b98\u7f51"}
                  </Button>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Shell>
  );
}
