import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  ArrowUp,
  Plus,
  FileText,
  Code,
  BookOpen,
  PenTool,
  Sparkles,
  X,
  CheckCircle,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Custom 0-dependency Markdown & Text Formatter with Dark/Light Mode support
function FormattedText({ content, isDarkMode }) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) return <div key={lineIdx} className="h-1" />;

        const isBullet = line.trim().startsWith("* ") || line.trim().startsWith("- ");
        const cleanLine = isBullet ? line.trim().substring(2) : line;

        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

        const renderedLine = parts.map((part, partIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong
                key={partIdx}
                className={`font-bold ${isDarkMode ? "text-zinc-100" : "text-slate-950"}`}
              >
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={partIdx}>{part}</span>;
        });

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-2 my-1">
              <span className={`font-bold select-none ${isDarkMode ? "text-zinc-400" : "text-slate-600"}`}>
                •
              </span>
              <div className="flex-1">{renderedLine}</div>
            </div>
          );
        }

        return <p key={lineIdx}>{renderedLine}</p>;
      })}
    </div>
  );
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const [activeCommandCategory, setActiveCommandCategory] = useState(null);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am AI DOC. Upload your document and ask me anything about it!",
    },
  ]);

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoadingAnswer]);

  const commandSuggestions = {
    learn: [
      "Summarize the main points of this document",
      "Explain the core concept in simple terms",
      "What are the key takeaways from this text?",
      "List the important definitions found here",
    ],
    code: [
      "Extract any code or formulas from the document",
      "Convert the steps in this doc into a flowchart algorithm",
      "Generate a Python script based on this text",
    ],
    write: [
      "Draft a 3-bullet executive summary of this file",
      "Write an email summarizing this document",
      "Create a presentation outline from this text",
    ],
  };

  const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:8000" : "";

  const handleUploadFile = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setUploadedFiles((prev) => [...prev, selectedFile.name]);

      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Document "${selectedFile.name}" uploaded successfully.`,
        },
      ]);
    } catch (error) {
      console.error("Upload error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Failed to upload "${selectedFile.name}". Please try again.`,
        },
      ]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoadingAnswer) return;

    const userText = inputValue;
    setInputValue("");
    setActiveCommandCategory(null);

    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setIsLoadingAnswer(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't reach the assistant server. Please check your connection.",
        },
      ]);
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  const handleCommandSelect = (command) => {
    setInputValue(command);
    setActiveCommandCategory(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const toggleCategory = (cat) => {
    setActiveCommandCategory((prev) => (prev === cat ? null : cat));
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-between transition-colors duration-300 p-4 md:p-6 font-sans ${
        isDarkMode ? "bg-zinc-950 text-zinc-100" : "bg-slate-100 text-slate-800"
      }`}
    >
      {/* Top Navbar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`font-bold tracking-wider text-sm ${isDarkMode ? "text-zinc-100" : "text-slate-900"}`}>
            AI DOC
          </span>
        </div>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2 rounded-full border transition-all ${
            isDarkMode
              ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-200 shadow-sm"
          }`}
          title="Toggle Dark/Light Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="w-full max-w-4xl mx-auto flex flex-col items-center flex-1">
        
        {/* GLOWING BLUE BADGE */}
        <div className="mb-3 mt-1 w-16 h-16 relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 200 200"
            className="w-full h-full drop-shadow-[0_0_25px_rgba(59,130,246,0.7)]"
          >
            <g clipPath="url(#cs_clip_1_ellipse-12)">
              <mask
                id="cs_mask_1_ellipse-12"
                style={{ maskType: "alpha" }}
                width="200"
                height="200"
                x="0"
                y="0"
                maskUnits="userSpaceOnUse"
              >
                <path
                  fill="#fff"
                  fillRule="evenodd"
                  d="M100 150c27.614 0 50-22.386 50-50s-22.386-50-50-50-50 22.386-50 50 22.386 50 50 50zm0 50c55.228 0 100-44.772 100-100S155.228 0 100 0 0 44.772 0 100s44.772 100 100 100z"
                  clipRule="evenodd"
                ></path>
              </mask>
              <g mask="url(#cs_mask_1_ellipse-12)">
                <path fill="#fff" d="M200 0H0v200h200V0z"></path>
                <path fill="#0066FF" fillOpacity="0.33" d="M200 0H0v200h200V0z"></path>
                <g filter="url(#filter0_f_844_2811)">
                  <path fill="#0066FF" d="M110 32H18v68h92V32z"></path>
                  <path fill="#0044FF" d="M188-24H15v98h173v-98z"></path>
                  <path fill="#0099FF" d="M175 70H5v156h170V70z"></path>
                  <path fill="#00CCFF" d="M230 51H100v103h130V51z"></path>
                </g>
              </g>
            </g>
            <defs>
              <filter
                id="filter0_f_844_2811"
                width="385"
                height="410"
                x="-75"
                y="-104"
                colorInterpolationFilters="sRGB"
                filterUnits="userSpaceOnUse"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend>
                <feGaussianBlur result="effect1_foregroundBlur_844_2811" stdDeviation="40"></feGaussianBlur>
              </filter>
              <clipPath id="cs_clip_1_ellipse-12">
                <path fill="#fff" d="M0 0H200V200H0z"></path>
              </clipPath>
            </defs>
          </svg>
        </div>

        {/* Header Title */}
        <div className="mb-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <h1 className={`text-3xl font-extrabold tracking-tight mb-1 ${isDarkMode ? "text-zinc-100" : "text-slate-900"}`}>
              AI DOC Assistant
            </h1>
            <p className={isDarkMode ? "text-zinc-400 text-sm" : "text-slate-600 text-sm"}>
              Intelligent Document Workspace
            </p>
          </motion.div>
        </div>

        {/* Chat History Display Area */}
        <div className="w-full flex-1 overflow-y-auto mb-4 px-2 space-y-4 max-h-[48vh]">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                msg.role === "user"
                  ? "justify-end"
                  : msg.role === "system"
                  ? "justify-center"
                  : "justify-start"
              }`}
            >
              {msg.role === "system" ? (
                <div
                  className={`flex items-center gap-2 text-xs px-4 py-2 rounded-full font-medium shadow-sm ${
                    isDarkMode
                      ? "bg-zinc-900 border border-zinc-800 text-zinc-300"
                      : "bg-slate-200 border border-slate-300 text-slate-800"
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>{msg.content}</span>
                </div>
              ) : (
                <div
                  className={`flex gap-3 max-w-2xl rounded-2xl p-4 shadow-sm ${
                    msg.role === "user"
                      ? isDarkMode
                        ? "bg-zinc-100 text-zinc-950 rounded-br-none font-medium"
                        : "bg-slate-900 text-white rounded-br-none font-medium"
                      : isDarkMode
                      ? "bg-zinc-900 text-zinc-100 rounded-bl-none border border-zinc-800"
                      : "bg-slate-200/90 text-slate-900 rounded-bl-none border border-slate-300/80 font-normal"
                  }`}
                >
                  <div className="flex-1">
                    <FormattedText content={msg.content} isDarkMode={isDarkMode} />
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {/* Loading state */}
          {isLoadingAnswer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div
                className={`rounded-2xl px-5 py-4 flex items-center shadow-sm border ${
                  isDarkMode
                    ? "bg-zinc-900 border-zinc-800 text-zinc-200"
                    : "bg-slate-200 border-slate-300 text-slate-800"
                }`}
              >
                <div className="flex space-x-1.5 items-center">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? "bg-zinc-400" : "bg-slate-600"}`}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.2s] ${isDarkMode ? "bg-zinc-400" : "bg-slate-600"}`}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.4s] ${isDarkMode ? "bg-zinc-400" : "bg-slate-600"}`}></div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area Card */}
        <div
          className={`w-full border rounded-2xl shadow-sm overflow-hidden mb-4 transition-colors ${
            isDarkMode
              ? "bg-zinc-900 border-zinc-800"
              : "bg-white border-slate-300"
          }`}
        >
          <div className="p-4">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask anything about your document..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className={`w-full text-base outline-none bg-transparent ${
                isDarkMode
                  ? "text-zinc-100 placeholder:text-zinc-500"
                  : "text-slate-900 placeholder:text-slate-400"
              }`}
            />
          </div>

          {/* Uploaded Files Pills */}
          {uploadedFiles.length > 0 && (
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 py-1.5 px-3 rounded-lg border text-xs font-medium ${
                      isDarkMode
                        ? "bg-zinc-800 border-zinc-700 text-zinc-200"
                        : "bg-slate-100 border-slate-300 text-slate-800"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>{file}</span>
                    <button
                      onClick={() =>
                        setUploadedFiles((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature Pills Row */}
          <div
            className={`px-4 py-3 flex items-center justify-between border-t ${
              isDarkMode ? "bg-zinc-950/60 border-zinc-800" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search Pill */}
              <button
                onClick={() => setSearchEnabled(!searchEnabled)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  searchEnabled
                    ? isDarkMode
                      ? "bg-zinc-100 text-zinc-950 font-semibold"
                      : "bg-slate-900 text-white font-semibold"
                    : isDarkMode
                    ? "bg-zinc-800/60 text-zinc-400 border border-zinc-800"
                    : "bg-white border border-slate-300 text-slate-600"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>

              {/* Learn Pill */}
              <button
                onClick={() => toggleCategory("learn")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCommandCategory === "learn"
                    ? isDarkMode
                      ? "bg-zinc-100 text-zinc-950 font-semibold"
                      : "bg-slate-900 text-white font-semibold"
                    : isDarkMode
                    ? "bg-zinc-800/60 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                    : "bg-white border border-slate-300 text-slate-600 hover:border-slate-400"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Learn</span>
              </button>

              {/* Code Pill */}
              <button
                onClick={() => toggleCategory("code")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCommandCategory === "code"
                    ? isDarkMode
                      ? "bg-zinc-100 text-zinc-950 font-semibold"
                      : "bg-slate-900 text-white font-semibold"
                    : isDarkMode
                    ? "bg-zinc-800/60 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                    : "bg-white border border-slate-300 text-slate-600 hover:border-slate-400"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Code</span>
              </button>

              {/* Write Pill */}
              <button
                onClick={() => toggleCategory("write")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCommandCategory === "write"
                    ? isDarkMode
                      ? "bg-zinc-100 text-zinc-950 font-semibold"
                      : "bg-slate-900 text-white font-semibold"
                    : isDarkMode
                    ? "bg-zinc-800/60 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                    : "bg-white border border-slate-300 text-slate-600 hover:border-slate-400"
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Write</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoadingAnswer}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                  inputValue.trim() && !isLoadingAnswer
                    ? isDarkMode
                      ? "bg-zinc-100 text-zinc-950 hover:bg-white hover:scale-105"
                      : "bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 shadow-sm"
                    : isDarkMode
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* File Upload Trigger */}
          <div
            className={`px-4 py-2.5 flex items-center justify-between border-t ${
              isDarkMode ? "bg-zinc-950/80 border-zinc-800" : "bg-slate-50 border-slate-200"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleUploadFile}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`flex items-center gap-2 text-xs font-semibold transition-colors ${
                isDarkMode ? "text-zinc-300 hover:text-white" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              {isUploading ? (
                <motion.div className="flex space-x-1" initial="hidden" animate="visible">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-ping"
                    />
                  ))}
                </motion.div>
              ) : (
                <Plus className="w-4 h-4 text-slate-500" />
              )}
              <span>{isUploading ? "Processing Document..." : "Upload Document"}</span>
            </button>

            <span className={isDarkMode ? "text-[11px] text-zinc-500 font-medium" : "text-[11px] text-slate-500 font-medium"}>
              Secure Workspace
            </span>
          </div>
        </div>

        {/* Command Suggestions Drawer */}
        <AnimatePresence>
          {activeCommandCategory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full mb-4 overflow-hidden"
            >
              <div
                className={`rounded-xl border shadow-sm overflow-hidden ${
                  isDarkMode
                    ? "bg-zinc-900 border-zinc-800"
                    : "bg-white border-slate-300"
                }`}
              >
                <div
                  className={`p-3 border-b ${
                    isDarkMode ? "bg-zinc-950/50 border-zinc-800" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {activeCommandCategory === "learn"
                      ? "Learning Prompts"
                      : activeCommandCategory === "code"
                      ? "Coding Prompts"
                      : "Writing Prompts"}
                  </h3>
                </div>
                <ul className={isDarkMode ? "divide-y divide-zinc-800" : "divide-y divide-slate-200"}>
                  {commandSuggestions[activeCommandCategory].map(
                    (suggestion, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleCommandSelect(suggestion)}
                        className={`p-3 cursor-pointer transition-colors duration-75 text-sm flex items-center gap-3 ${
                          isDarkMode
                            ? "hover:bg-zinc-800/80 text-zinc-200"
                            : "hover:bg-slate-100 text-slate-800"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </motion.li>
                    )
                  )}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
