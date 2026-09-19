"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
  if (!message.trim() || loading) return;

  const userMessage: Message = {
    role: "user",
    content: message.trim(),
  };

  const updatedMessages = [...messages, userMessage];

  setMessages(updatedMessages);
  setMessage("");
  setLoading(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: updatedMessages,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to connect to AI");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Database query failed");
    }

    setMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        content: data.answer,
      },
    ]);
  } catch (error) {
    console.error("CHAT ERROR:", error);

    setMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        content: "Something went wrong.",
      },
    ]);
  } finally {
    setLoading(false);
  }
}

  function startNewChat() {
    setMessages([]);
    setMessage("");
  }

  return (
    <main className="flex h-screen bg-slate-950 text-white">

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 p-4">

        <div className="mb-6 text-xl font-bold">
          AI Assistant
        </div>

        <button
          onClick={startNewChat}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-left font-medium hover:bg-blue-700"
        >
          + New Chat
        </button>

        <div className="mt-8">
          <p className="mb-3 text-xs uppercase text-slate-500">
            Recent Chats
          </p>

          <div className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
            AI Architecture
          </div>

          <div className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
            Databricks Help
          </div>

          <div className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
            Azure Questions
          </div>
        </div>

      </aside>

      {/* Main Chat */}
      <section className="flex flex-1 flex-col">

        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800 px-6">

          <div>
            <h1 className="font-semibold">
              AI Assistant
            </h1>

            <p className="text-xs text-slate-500">
              Your intelligent AI workspace
            </p>
          </div>

          <button className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">
            Settings
          </button>

        </header>

        {/* Chat Content */}
        <div className="flex-1 overflow-y-auto">

          <div className="mx-auto w-full max-w-3xl px-6 py-8">

            {/* Welcome */}
            {messages.length === 0 && (
              <div className="text-center">

                <div className="mb-6 text-5xl">
                  🤖
                </div>

                <h2 className="text-3xl font-bold">
                  How can I help you ??DEVELOPED BY NANDA
                </h2>

                <p className="mt-3 text-slate-400">
                  Ask questions, analyze data, generate code, or connect
                  your own knowledge.
                </p>

                {/* Example prompts */}
                <div className="mt-8 grid grid-cols-2 gap-3">

                  <button
                    onClick={() =>
                      setMessage("Explain something in simple terms")
                    }
                    className="rounded-xl border border-slate-800 p-4 text-left hover:bg-slate-900"
                  >
                    <div className="font-medium">
                      Explain something
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      Explain a technical concept
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      setMessage("Write Python code for me")
                    }
                    className="rounded-xl border border-slate-800 p-4 text-left hover:bg-slate-900"
                  >
                    <div className="font-medium">
                      Write code
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      Generate Python or SQL
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      setMessage("Help me analyze my data")
                    }
                    className="rounded-xl border border-slate-800 p-4 text-left hover:bg-slate-900"
                  >
                    <div className="font-medium">
                      Analyze data
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      Ask questions about your data
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      setMessage("How can I search my documents?")
                    }
                    className="rounded-xl border border-slate-800 p-4 text-left hover:bg-slate-900"
                  >
                    <div className="font-medium">
                      Search knowledge
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      Search your documents
                    </div>
                  </button>

                </div>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-4">

              {messages.map((msg, index) => (

                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  <div
                    className={`max-w-[80%] rounded-xl p-4 ${
                      msg.role === "user"
                        ? "bg-blue-600"
                        : "border border-slate-800 bg-slate-900"
                    }`}
                  >

                    <p className="mb-1 text-xs text-slate-400">
                      {msg.role === "user"
                        ? "You"
                        : "AI Assistant"}
                    </p>

                    <p className="whitespace-pre-wrap">
                      {msg.content}
                    </p>

                  </div>

                </div>

              ))}

              {/* Loading */}
              {loading && (
                <div className="flex justify-start">

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">

                    <p className="text-sm text-slate-400">
                      AI Assistant
                    </p>

                    <p className="mt-2">
                      Thinking...
                    </p>

                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

        {/* Input */}
        <div className="border-t border-slate-800 p-5">

          <div className="mx-auto flex max-w-3xl items-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2">

            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent px-2 py-3 outline-none placeholder:text-slate-500"
            />

            <button
              className="rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
              onClick={sendMessage}
              disabled={loading || !message.trim()}
            >
              {loading ? "Sending..." : "Send"}
            </button>

          </div>

        </div>

      </section>

    </main>
  );
}