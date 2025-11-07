import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  ShieldCheck,
  BarChart3,
  Users,
  ClipboardList,
  Minimize2,
  MessageSquare,
  Send,
  Loader2,
  Mic,
  MicOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ChatBubble,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { MessageLoading } from "@/components/ui/message-loading";
import { ChatInput } from "@/components/ui/chat-input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  isAbovePanel?: boolean;
  isPanelExpanded?: boolean;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognitionInstance;

interface BrowserSpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
}

interface BrowserSpeechRecognitionEvent {
  results: BrowserSpeechRecognitionResultList;
}

interface BrowserSpeechRecognitionResultList {
  length: number;
  item: (index: number) => BrowserSpeechRecognitionResult;
  [index: number]: BrowserSpeechRecognitionResult;
}

interface BrowserSpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: BrowserSpeechRecognitionAlternative;
  length: number;
}

interface BrowserSpeechRecognitionAlternative {
  transcript: string;
}

interface BrowserSpeechRecognitionErrorEvent {
  error: string;
}

interface BrowserSpeechRecognitionWindow extends Window {
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
}

interface ExtendedSpeechRecognitionWindow extends BrowserSpeechRecognitionWindow {
  mozSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  msSpeechRecognition?: BrowserSpeechRecognitionConstructor;
}

type MicrophonePermissionState = "prompt" | "granted" | "denied" | "not-supported";

type MicrophonePermissionDescriptor = PermissionDescriptor & { name: "microphone" };

type MicrophoneErrorKind =
  | "none"
  | "permission"
  | "no-speech"
  | "audio"
  | "network"
  | "generic";

interface RoleTheme {
  label: string;
  sublabel: string;
  gradient: string;
  avatarFallback: string;
  icon: React.ReactNode;
}

const ROLE_THEMES: Record<string, RoleTheme> = {
  superadmin: {
    label: "Platform Control",
    sublabel: "Superadmin Mode",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    avatarFallback: "SA",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  owner: {
    label: "Org Overview",
    sublabel: "Owner Mode",
    gradient: "from-primary via-primary/80 to-purple-500",
    avatarFallback: "OW",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  admin: {
    label: "Operations Desk",
    sublabel: "Admin Mode",
    gradient: "from-sky-500 via-blue-500 to-indigo-500",
    avatarFallback: "AD",
    icon: <ClipboardList className="h-5 w-5" />,
  },
  manager: {
    label: "Team Navigator",
    sublabel: "Manager Mode",
    gradient: "from-emerald-500 via-emerald-500 to-teal-500",
    avatarFallback: "MG",
    icon: <Users className="h-5 w-5" />,
  },
};

const BASE_SUGGESTIONS = [
  {
    label: "Daily snapshot",
    prompt:
      "Give me a concise daily operations snapshot for my organization (max 5 bullets).",
  },
  {
    label: "Route issues",
    prompt:
      "List any route assignments that need attention today and what actions I should take.",
  },
  {
    label: "Upcoming deadlines",
    prompt:
      "Highlight upcoming deadlines or renewals I should know about this week, in under 4 bullets.",
  },
];

const ROLE_SUGGESTIONS: Record<string, { label: string; prompt: string }[]> = {
  superadmin: [
    {
      label: "System health",
      prompt:
        "Summarize overall platform health and any anomalies that superadmins should address immediately.",
    },
  ],
  owner: [
    {
      label: "KPI pulse",
      prompt:
        "What are my organization's key metrics right now? Keep it concise with 3 actionable bullets.",
    },
    {
      label: "Add admin",
      prompt: "How do I add an admin to my organization? Walk me through the steps briefly.",
    },
    {
      label: "Member error",
      prompt: "Why am I getting a 'not a member' error? Give me a quick diagnostic checklist.",
    },
  ],
  admin: [
    {
      label: "Route optimize",
      prompt:
        "How do I optimize route assignments today? Provide the top actions I should consider.",
    },
    {
      label: "Vehicle care",
      prompt:
        "What's the best way to manage vehicle maintenance this week? Focus on the essentials.",
    },
    {
      label: "Payroll help",
      prompt:
        "Help me understand the payroll report in under 4 bullets, highlighting any anomalies.",
    },
  ],
  manager: [
    {
      label: "Assign team",
      prompt: "How do I assign employees to routes? Summarize the process in 3 steps.",
    },
    {
      label: "Shift process",
      prompt: "What's the process for scheduling shifts? Keep the answer short and actionable.",
    },
    {
      label: "Driver availability",
      prompt: "How can I track driver availability right now? Provide a quick checklist.",
    },
  ],
};

const markdownComponents = {
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-3 last:mb-0 text-sm leading-relaxed text-gray-900 dark:text-white">
      {children}
    </p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc pl-5 text-sm text-gray-900 dark:text-white">
      {children}
    </ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="list-decimal pl-5 text-sm text-gray-900 dark:text-white">
      {children}
    </ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="leading-relaxed text-gray-900 dark:text-white">{children}</li>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="italic text-gray-900 dark:text-white">{children}</em>
  ),
  code: ({ children, inline }: { children: React.ReactNode; inline?: boolean }) =>
    inline ? (
      <code className="rounded bg-gray-200 dark:bg-white/20 px-1.5 py-0.5 text-xs text-gray-900 dark:text-white">
        {children}
      </code>
    ) : (
      <pre className="overflow-x-auto rounded-lg bg-gray-200 dark:bg-white/10 px-3 py-2 text-xs text-gray-900 dark:text-white">
        <code>{children}</code>
      </pre>
    ),
  a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-blue-600 dark:text-white underline-offset-4 hover:underline"
    >
      {children}
    </a>
  ),
};

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose, userRole = "user", isAbovePanel = false, isPanelExpanded = false }) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [micPermission, setMicPermission] = useState<MicrophonePermissionState>("prompt");
  const [voiceSupportHint, setVoiceSupportHint] = useState<string | null>(null);
  const [micErrorKind, setMicErrorKind] = useState<MicrophoneErrorKind>("none");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognitionInstance | null>(null);
  const permissionStatusRef = useRef<PermissionStatus | null>(null);
  const baseVoiceInputRef = useRef<string>("");
  const baseInputSnapshotRef = useRef<string>("");
  const voiceFinalTextRef = useRef<string>("");
  const interimTranscriptRef = useRef<string>("");
  const isRecordingRef = useRef(false);
  const restartTimeoutRef = useRef<number | null>(null);

  const clearPendingRestart = useCallback(() => {
    if (restartTimeoutRef.current !== null) {
      window.clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const roleTheme = ROLE_THEMES[userRole] || {
    label: "Assistant Desk",
    sublabel: "Assistant Mode",
    gradient: "from-primary via-primary/80 to-purple-500",
    avatarFallback: "AI",
    icon: <Sparkles className="h-5 w-5" />,
  };

  const suggestions = useMemo(() => {
    return [...BASE_SUGGESTIONS, ...(ROLE_SUGGESTIONS[userRole] || [])];
  }, [userRole]);

  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      setMicPermission("not-supported");
      setError("Microphone access is not available in this browser.");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission("granted");
      setError(null);
      setMicErrorKind("none");
      return true;
    } catch (err) {
      console.error("Microphone permission error:", err);
      setMicPermission("denied");
      setMicErrorKind("permission");

      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError(
          "Microphone access is blocked. Please enable it in your browser settings and try again.",
        );
      } else {
        setError("Unable to access microphone. Please check browser permissions.");
      }

      return false;
    }
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    if (!isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!window.isSecureContext) {
      setIsVoiceSupported(false);
      recognitionRef.current = null;
      setVoiceSupportHint(
        "Voice mode requires a secure context. Open this app via https:// or localhost to enable the microphone.",
      );
      return;
    }

    const speechWindow = window as ExtendedSpeechRecognitionWindow;
    const SpeechRecognitionConstructor =
      speechWindow.SpeechRecognition ||
      speechWindow.webkitSpeechRecognition ||
      speechWindow.mozSpeechRecognition ||
      speechWindow.msSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setIsVoiceSupported(false);
      recognitionRef.current = null;
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes("firefox")) {
        setVoiceSupportHint(
          "Firefox currently disables speech recognition by default. In about:config enable media.webspeech.recognition.enable and media.webspeech.recognition.force_enable, then reload this page.",
        );
      } else {
        setVoiceSupportHint(
          "Voice mode is unavailable. Use a browser with Web Speech API support (Chrome, Edge, Vivaldi) while we continue expanding compatibility.",
        );
      }
      return;
    }

    let recognition: BrowserSpeechRecognitionInstance | null = null;

    try {
      recognition = new SpeechRecognitionConstructor();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognitionRef.current = recognition;
      setIsVoiceSupported(true);
      setVoiceSupportHint(null);
    } catch (instantiationError) {
      console.error("Speech recognition init error:", instantiationError);
      recognitionRef.current = null;
      setIsVoiceSupported(false);
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes("firefox")) {
        setVoiceSupportHint(
          "Speech recognition failed to start. Confirm media.webspeech.recognition.enable is true in about:config and reload the page.",
        );
      } else {
        setVoiceSupportHint(
          "Voice mode is unavailable. Ensure this page is served over HTTPS, then retry or switch to Chrome/Edge/Vivaldi.",
        );
      }
      return;
    }

    return () => {
      if (!recognition) {
        return;
      }

      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // recognition may already be inactive
      }
      recognitionRef.current = null;
      clearPendingRestart();
    };
  }, [clearPendingRestart]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicPermission("not-supported");
      return;
    }

    if (!navigator.permissions?.query) {
      return;
    }

    let isCancelled = false;

    navigator.permissions
      .query({ name: "microphone" } as MicrophonePermissionDescriptor)
      .then((status) => {
        if (isCancelled) {
          return;
        }

        permissionStatusRef.current = status;
        setMicPermission(status.state as MicrophonePermissionState);

        status.onchange = () => {
          setMicPermission(status.state as MicrophonePermissionState);
        };
      })
      .catch(() => {
        // Navigator permissions may not support microphone queries in some browsers.
      });

    return () => {
      isCancelled = true;
      if (permissionStatusRef.current) {
        permissionStatusRef.current.onchange = null;
        permissionStatusRef.current = null;
      }
    };
  }, []);

  const sendMessage = useCallback(
    async (messageContent: string) => {
      const trimmedContent = messageContent.trim();

      if (!trimmedContent || isLoading) {
        return;
      }

      const previousState = {
        inputValue: messageContent,
        baseSnapshot: baseInputSnapshotRef.current,
        baseVoice: baseVoiceInputRef.current,
        voiceFinal: voiceFinalTextRef.current,
        interim: interimTranscriptRef.current,
      };

      setInput("");
      setError(null);
      setMicErrorKind("none");
      baseInputSnapshotRef.current = "";
      baseVoiceInputRef.current = "";
      voiceFinalTextRef.current = "";
      interimTranscriptRef.current = "";

      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: trimmedContent,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMessage]);
      setIsLoading(true);

      try {
        const response = await axios.post(
          `${API_URL}/api/ai/chat`,
          {
            message: trimmedContent,
            conversationId: conversation?.id,
          },
          {
            withCredentials: true,
          },
        );

        if (!conversation) {
          setConversation({
            id: response.data.conversationId,
            title: response.data.message?.conversationTitle || "New Conversation",
            messages: [],
          });
        }

        const assistantMessage: Message = {
          id: response.data.message.id,
          role: "assistant",
          content: response.data.message.content,
          createdAt: response.data.message.createdAt,
        };

        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempUserMessage.id);
          return [
            ...withoutTemp,
            {
              ...tempUserMessage,
              id: `user-${Date.now()}`,
              createdAt: tempUserMessage.createdAt,
            },
            assistantMessage,
          ];
        });
      } catch (err) {
        console.error("AI chat error:", err);
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));

        setMicErrorKind("generic");
        setInput(previousState.inputValue);
        baseInputSnapshotRef.current = previousState.baseSnapshot;
        baseVoiceInputRef.current = previousState.baseVoice;
        voiceFinalTextRef.current = previousState.voiceFinal;
        interimTranscriptRef.current = previousState.interim;

        if (axios.isAxiosError(err)) {
          const { response, code, message } = err;
          if (!response) {
            setError(
              code === "ERR_NETWORK"
                ? "AI service is unreachable. Ensure the backend server is running and accessible."
                : message || "Network error while sending the message.",
            );
          } else if (response.status === 429) {
            setError("Rate limit exceeded. Please try again in a few minutes.");
          } else if (response.status === 401) {
            setError("Authentication required. Please log in.");
          } else {
            setError(response.data?.message || "Failed to send message. Please try again.");
          }
        } else {
          setError("Failed to send message. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [API_URL, conversation, isLoading],
  );

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    const scheduleRestart = () => {
      if (!isRecordingRef.current) {
        return;
      }
      clearPendingRestart();
      restartTimeoutRef.current = window.setTimeout(() => {
        if (!isRecordingRef.current) {
          restartTimeoutRef.current = null;
          return;
        }
        try {
          recognition.start();
        } catch (restartError) {
          if (
            !(restartError instanceof DOMException && restartError.name === "InvalidStateError")
          ) {
            console.error("Speech recognition restart error:", restartError);
            isRecordingRef.current = false;
            setIsRecording(false);
          }
        } finally {
          restartTimeoutRef.current = null;
        }
      }, 200);
    };

    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      const { results } = event;

      const joinWithSpace = (base: string, addition: string) => {
        if (!addition) return base;
        if (!base) return addition;
        return /\s$/.test(base) ? `${base}${addition}` : `${base} ${addition}`;
      };

      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = 0; i < results.length; i += 1) {
        const result = results[i];
        const transcript = result[0]?.transcript?.trim() || "";

        if (!transcript) {
          continue;
        }

        if (result.isFinal) {
          finalTranscript = finalTranscript
            ? `${finalTranscript} ${transcript}`
            : transcript;
        } else {
          interimTranscript = transcript;
        }
      }

      const baseSnapshot = baseInputSnapshotRef.current;
      const trimmedFinal = finalTranscript.trim();
      let resolvedFinal = voiceFinalTextRef.current.trim();

      if (trimmedFinal) {
        resolvedFinal = trimmedFinal;
        setMicErrorKind("none");
        setError(null);
      }

      voiceFinalTextRef.current = resolvedFinal;

      const baseWithResolvedFinal = joinWithSpace(baseSnapshot, resolvedFinal);
      baseVoiceInputRef.current = baseWithResolvedFinal;

      const trimmedInterim = interimTranscript.trim();

      if (trimmedInterim) {
        interimTranscriptRef.current = trimmedInterim;
        const previewText = joinWithSpace(baseWithResolvedFinal, trimmedInterim);
        setInput(previewText);
      } else {
        interimTranscriptRef.current = "";
        setInput(baseWithResolvedFinal);
      }
    };

    recognition.onerror = (event: BrowserSpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        interimTranscriptRef.current = "";
        voiceFinalTextRef.current = "";
        baseVoiceInputRef.current = inputRef.current?.value ?? baseVoiceInputRef.current;
        baseInputSnapshotRef.current = baseVoiceInputRef.current;
        setMicErrorKind("no-speech");
        setError("No speech detected. Still listening...");
        scheduleRestart();
        return;
      }

      if (event.error === "aborted") {
        return;
      }

      if (event.error === "network") {
        setMicErrorKind("network");
        setError("Connection to the speech service dropped. Trying again...");
        scheduleRestart();
        return;
      }

      isRecordingRef.current = false;
      setIsRecording(false);
      clearPendingRestart();
      interimTranscriptRef.current = "";
      voiceFinalTextRef.current = "";
      baseVoiceInputRef.current = inputRef.current?.value ?? baseVoiceInputRef.current;
      baseInputSnapshotRef.current = baseVoiceInputRef.current;

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setMicPermission("denied");
        setMicErrorKind("permission");
        setError("Microphone access is blocked. Click Allow below to re-request access.");
        void requestMicrophoneAccess();
      } else if (event.error === "audio-capture") {
        setMicErrorKind("audio");
        setError("Microphone not found. Connect a mic or check system settings, then retry.");
      } else {
        setMicErrorKind("generic");
        setError("Microphone error. Please check permissions and try again.");
        if (micPermission !== "granted") {
          void requestMicrophoneAccess();
        }
      }
    };

    recognition.onend = () => {
      interimTranscriptRef.current = "";
      voiceFinalTextRef.current = "";
      baseVoiceInputRef.current = inputRef.current?.value ?? baseVoiceInputRef.current;
      baseInputSnapshotRef.current = baseVoiceInputRef.current;
      if (isRecordingRef.current) {
        scheduleRestart();
      } else {
        clearPendingRestart();
        setIsRecording(false);
      }
    };

    return () => {
      clearPendingRestart();
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
    };
  }, [clearPendingRestart, micPermission, requestMicrophoneAccess]);

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const startRecognitionSession = useCallback(async (): Promise<boolean> => {
    let recognition = recognitionRef.current;

    if (!recognition && typeof window !== "undefined" && window.isSecureContext) {
      const speechWindow = window as ExtendedSpeechRecognitionWindow;
      const SpeechRecognitionConstructor =
        speechWindow.SpeechRecognition ||
        speechWindow.webkitSpeechRecognition ||
        speechWindow.mozSpeechRecognition ||
        speechWindow.msSpeechRecognition;

      if (SpeechRecognitionConstructor) {
        try {
          recognition = new SpeechRecognitionConstructor();
          recognition.lang = "en-US";
          recognition.continuous = true;
          recognition.interimResults = true;
          recognitionRef.current = recognition;
          setIsVoiceSupported(true);
          setVoiceSupportHint(null);
        } catch (instantiationError) {
          console.error("Speech recognition instantiation error during start:", instantiationError);
          recognition = null;
        }
      }
    }

    const previousState = {
      baseSnapshot: baseInputSnapshotRef.current,
      baseVoice: baseVoiceInputRef.current,
      voiceFinal: voiceFinalTextRef.current,
      interim: interimTranscriptRef.current,
    };

    const currentInputValue = inputRef.current?.value ?? "";
    baseInputSnapshotRef.current = currentInputValue;
    baseVoiceInputRef.current = currentInputValue;
    voiceFinalTextRef.current = "";
    interimTranscriptRef.current = "";

    if (!recognition) {
      setError(
        "Voice mode is not supported in this browser. Please try the latest Chrome, Edge, or Firefox with speech recognition enabled.",
      );
      setMicErrorKind("generic");
      return false;
    }

    if (micPermission !== "granted") {
      const granted = await requestMicrophoneAccess();
      if (!granted) {
        return false;
      }
    }

    clearPendingRestart();

    try {
      setError(null);
      setMicErrorKind("none");
      recognition.start();
      isRecordingRef.current = true;
      setIsRecording(true);
      return true;
    } catch (err) {
      console.error("Voice start error:", err);
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "SecurityError") {
          setMicPermission("denied");
          setMicErrorKind("permission");
          setError("Microphone access is blocked. Click Allow below to re-request access.");
          void requestMicrophoneAccess();
        } else if (err.name === "InvalidStateError") {
          isRecordingRef.current = true;
          setIsRecording(true);
          setError(null);
          setMicErrorKind("none");
          return true;
        } else if (err.name === "NotReadableError") {
          setMicErrorKind("audio");
          setError("Unable to access the microphone. Check system privacy settings, then retry.");
        } else {
          setMicErrorKind("generic");
          setError(err.message || "Unable to start voice input. Please ensure microphone access is allowed and try again.");
        }
      } else {
        setMicErrorKind("generic");
        setError("Unable to start voice input. Please ensure microphone access is allowed and try again.");
      }
      isRecordingRef.current = false;
      setIsRecording(false);
      baseInputSnapshotRef.current = previousState.baseSnapshot;
      baseVoiceInputRef.current = previousState.baseVoice;
      voiceFinalTextRef.current = previousState.voiceFinal;
      interimTranscriptRef.current = previousState.interim;
      return false;
    }
  }, [clearPendingRestart, micPermission, requestMicrophoneAccess]);

  const handleRetryListening = useCallback(() => {
    setError(null);
    setMicErrorKind("none");

    const recognition = recognitionRef.current;
    if (recognition && isRecordingRef.current) {
      clearPendingRestart();
      try {
        recognition.start();
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "InvalidStateError")) {
          void startRecognitionSession();
        }
      }
      return;
    }

    void startRecognitionSession();
  }, [clearPendingRestart, startRecognitionSession]);

  const handleVoiceToggle = useCallback(async () => {
    const recognition = recognitionRef.current;

    if (recognition && isRecording) {
      clearPendingRestart();
      try {
        recognition.stop();
      } catch {
        // stop can throw if recognition is already idle
      }
      if (typeof recognition.abort === "function") {
        recognition.abort();
      }
      isRecordingRef.current = false;
      setIsRecording(false);
      setMicErrorKind("none");
      setError(null);
      interimTranscriptRef.current = "";
      baseVoiceInputRef.current = inputRef.current?.value ?? baseVoiceInputRef.current;
      baseInputSnapshotRef.current = inputRef.current?.value ?? baseInputSnapshotRef.current;
      voiceFinalTextRef.current = "";
      return;
    }

    const started = await startRecognitionSession();
    if (started) {
      isRecordingRef.current = true;
    }
  }, [clearPendingRestart, isRecording, startRecognitionSession]);

  const handleSendMessage = async () => {
    if (!input.trim()) {
      return;
    }

    await sendMessage(input);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-300",
        isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        // Position matches AIAssistantButton logic:
        // No panel: bottom-6 (24px from bottom)
        // Panel collapsed (48px): bottom-[72px] (48px + 24px spacing)
        // Panel expanded (500px): bottom-[524px] (500px + 24px spacing)
        "right-6",
        !isAbovePanel ? "bottom-6" : isPanelExpanded ? "bottom-[524px]" : "bottom-[72px]",
      )}
    >
      <div
        className={cn(
          "relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card/95 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all duration-300",
          isMinimized
            ? "h-[64px] w-[21rem]"
            : "h-[34rem] w-[25rem] sm:w-[26rem] lg:h-[36rem] lg:w-[28rem] xl:h-[40rem] xl:w-[32rem]",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 text-white border-b border-black/20 dark:border-white/20 shadow-lg",
            "bg-gradient-to-r",
            roleTheme.gradient,
          )}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20 backdrop-blur dark:bg-white/15">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-black dark:text-white"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wide text-black dark:text-white">
                {roleTheme.sublabel}
              </span>
              <span className="text-sm font-semibold leading-tight text-black dark:text-white">
                {roleTheme.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/20 text-black hover:bg-black/30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              onClick={() => setIsMinimized((prev) => !prev)}
              aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
            >
              {isMinimized ? (
                <MessageSquare className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/20 text-black hover:bg-black/30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              onClick={onClose}
              aria-label="Close chat"
            >
              <span className="sr-only">Close chat</span>
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                stroke="currentColor"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="flex flex-col bg-gradient-to-b from-background/70 via-background/80 to-background/95 overflow-hidden">
              <div className="relative flex-1 min-h-0 px-4 py-2 overflow-hidden">
                <ChatMessageList smooth className="bg-transparent pb-2">
                  {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-card/60 px-6 py-10 text-center text-muted-foreground">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          Start a conversation
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ask a concise question or choose a quick prompt below to get going.
                        </p>
                      </div>
                      <div className="flex w-full flex-wrap justify-center gap-2">
                        {suggestions.map((suggestion) => (
                          <Button
                            key={suggestion.label}
                            size="sm"
                            variant="outline"
                            onClick={() => handleSuggestionClick(suggestion.prompt)}
                            className="h-8 rounded-full border-border bg-background text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary"
                          >
                            {suggestion.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((message) => {
                    const isUser = message.role === "user";
                    return (
                      <ChatBubble
                        key={message.id}
                        variant={isUser ? "sent" : "received"}
                        className="items-start"
                      >
                        {!isUser && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                            <svg
                              viewBox="0 0 24 24"
                              className="h-5 w-5 text-primary"
                              fill="currentColor"
                            >
                              <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex max-w-[85%] flex-col gap-2">
                          <ChatBubbleMessage
                            variant={isUser ? "sent" : "received"}
                            className={cn(
                              "prose prose-sm max-w-none text-left leading-relaxed",
                              "dark:prose-invert",
                              isUser
                                ? "bg-blue-500 text-white shadow-lg dark:bg-primary dark:text-white [&_p]:text-white [&_ul]:text-white [&_ol]:text-white [&_li]:text-white [&_strong]:text-white [&_em]:text-white [&_a]:text-white dark:[&_p]:text-white dark:[&_ul]:text-white dark:[&_ol]:text-white dark:[&_li]:text-white dark:[&_strong]:text-white dark:[&_em]:text-white dark:[&_a]:text-white"
                                : "bg-white/40 border border-white/60 shadow-lg text-gray-900 dark:bg-gray-800/90 dark:border-gray-700/60 dark:text-white",
                            )}
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents as never}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </ChatBubbleMessage>
                          <span
                            className={cn(
                              "text-[11px] font-medium text-muted-foreground",
                              isUser ? "text-primary/60" : "text-muted-foreground/70",
                            )}
                          >
                            {formatTimestamp(message.createdAt)}
                          </span>
                        </div>
                      </ChatBubble>
                    );
                  })}

                  {isLoading && (
                    <ChatBubble variant="received">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5 text-primary"
                          fill="currentColor"
                        >
                          <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z" />
                        </svg>
                      </div>
                      <ChatBubbleMessage className="bg-background text-foreground">
                        <MessageLoading />
                      </ChatBubbleMessage>
                    </ChatBubble>
                  )}

                  {error && (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      <span className="flex-1 text-left">{error}</span>
                      <div className="flex items-center gap-2">
                        {(micErrorKind === "no-speech" || micErrorKind === "network") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-destructive text-destructive hover:bg-destructive/10"
                            onClick={handleRetryListening}
                          >
                            Retry Listening
                          </Button>
                        )}
                        {micErrorKind === "permission" && micPermission !== "not-supported" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-destructive text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              void requestMicrophoneAccess().then((granted) => {
                                if (granted) {
                                  setError(null);
                                  setMicErrorKind("none");
                                }
                              });
                            }}
                          >
                            Request Access
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-destructive hover:text-destructive"
                          onClick={() => {
                            setError(null);
                            setMicErrorKind("none");
                          }}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  )}
                </ChatMessageList>
              </div>

              <div className="flex-shrink-0 border-t border-border/80 bg-background/95 px-4 py-3">
                <div className="space-y-2">
                  <div className="flex items-end gap-3">
                    <ChatInput
                      ref={inputRef}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask something precise..."
                      disabled={isLoading}
                      className="h-auto min-h-[58px] rounded-2xl border border-border/80 bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-primary/40"
                    />
                    {isVoiceSupported && (
                      <Button
                        type="button"
                        variant={isRecording ? "default" : "outline"}
                        onClick={() => {
                          void handleVoiceToggle();
                        }}
                        className={cn(
                          "h-[48px] w-[48px] rounded-full border-border/80 transition-colors",
                          isRecording
                            ? "bg-primary text-black hover:bg-primary/90 dark:text-primary-foreground"
                            : "bg-card hover:bg-primary/10 hover:text-primary",
                        )}
                        aria-label={isRecording ? "Stop voice input" : "Start voice input"}
                      >
                        {isRecording ? (
                          <MicOff className="h-5 w-5 text-black dark:text-primary-foreground" />
                        ) : (
                          <Mic className="h-5 w-5 text-foreground" />
                        )}
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isLoading}
                      className="h-[48px] w-[48px] rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 disabled:bg-muted disabled:text-muted-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                      aria-label="Send message"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground/80">
                    <span>
                      {isVoiceSupported
                        ? "Enter to send · Shift+Enter for newline · Tap mic for voice"
                        : "Enter to send · Shift+Enter for newline"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Powered by Gemini Flash
                    </span>
                  </div>
                  {micPermission === "not-supported" && (
                    <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-2 text-[11px] font-medium text-muted-foreground">
                      This browser does not expose microphone access or speech recognition APIs. Try the latest Chrome, Edge, or Firefox Dev Edition.
                    </div>
                  )}
                  {micPermission === "denied" && (
                    <div className="flex items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] font-semibold text-destructive">
                      <span>Microphone access is blocked. Update permissions, then retry.</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-destructive hover:text-destructive"
                        onClick={() => {
                          void requestMicrophoneAccess().then((granted) => {
                            if (granted) {
                              setError(null);
                              setMicErrorKind("none");
                            }
                          });
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                  {micPermission === "prompt" && isVoiceSupported && (
                    <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 text-[11px] font-semibold text-primary">
                      <span>Allow microphone access to try the voice assistant.</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-primary hover:text-primary"
                        onClick={() => {
                          void requestMicrophoneAccess().then((granted) => {
                            if (granted) {
                              setError(null);
                              setMicErrorKind("none");
                            }
                          });
                        }}
                      >
                        Allow
                      </Button>
                    </div>
                  )}
                  {voiceSupportHint && (
                    <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-2 text-[11px] font-medium text-muted-foreground">
                      {voiceSupportHint}
                    </div>
                  )}
                  {isRecording && (
                    <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                      </span>
                      Listening...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIChat;
