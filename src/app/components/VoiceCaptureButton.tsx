import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";

interface SpeechRecognitionResultLike {
  results: ArrayLike<{ 0?: { transcript?: string } }>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface VoiceCaptureButtonProps {
  disabled?: boolean;
  onTranscript: (text: string) => void;
}

export default function VoiceCaptureButton({ disabled, onTranscript }: VoiceCaptureButtonProps) {
  const { t } = useLanguage();
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const toggle = () => {
    if (disabled) return;

    const win = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRecognitionCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      onTranscript(t("voice.notSupported"));
      return;
    }

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = document.documentElement.lang || "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) onTranscript(transcript);
      setRecording(false);
    };
    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-label={recording ? t("voice.stop") : t("voice.start")}
      title={recording ? t("voice.stop") : t("voice.start")}
      className={`composer-control flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        recording ? "bg-primary/15 text-primary" : "text-text/60 hover:text-primary"
      }`}
    >
      {recording ? <Square className="h-3.5 w-3.5 fill-current" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
