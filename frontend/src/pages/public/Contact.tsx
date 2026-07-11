import React, { useState } from "react";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { CheckCircle2, Globe, ArrowRight } from "lucide-react";
import { useToast } from "../../context/ToastContext";

import { GithubIcon, LinkedinIcon } from "../../components/shared/Icons";
import { Select } from "../../components/shared/Select";
import api from "../../api/axiosInstance";

export const Contact: React.FC = () => {
  const { showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("general");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Name is required";
    if (!email.trim()) {
      errs.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = "Email format is invalid";
    }
    if (!message.trim()) errs.message = "Message cannot be empty";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.post("/contact", {
        fullName,
        email,
        topic,
        message,
      });
      setSuccess(true);
      showToast("success", "Message submitted successfully.");
      setFullName("");
      setEmail("");
      setTopic("general");
      setMessage("");
    } catch (error: unknown) {
      console.error("Failed to submit contact form:", error);
      showToast(
        "error",
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to send message. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="relative overflow-hidden py-24 md:py-32">
        {/* Animated background glow */}
        <div className="ambient-glow-animated" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-16">
          {/* Header Hero Section */}
          <div className="space-y-4 max-w-2xl">
            <h1 className="font-display text-text-primary text-[3rem] md:text-[4.5rem] leading-[1.05] tracking-tight">
              Get in Touch.
            </h1>
            <p className="text-text-secondary text-body-lg leading-relaxed">
              Have questions about statement formats, bug reports, or feature
              ideas? Fill out the form below or reach out to us directly.
            </p>
          </div>

          {/* Asymmetrical 60/40 Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Left Column (60%): Interactive Glassmorphism Form */}
            <div className="lg:col-span-3 card bg-bg-surface/60 backdrop-blur-2xl border border-white/5 p-8 md:p-12 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-linear-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="relative z-10">
                {success ? (
                  <div className="text-center py-16 space-y-6">
                    <div className="mx-auto h-20 w-20 rounded-full bg-success/10 text-success flex items-center justify-center animate-fade-up-1">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <div className="space-y-3 animate-fade-up-2">
                      <h2 className="font-display text-text-primary text-3xl">
                        Message Sent
                      </h2>
                      <p className="text-text-secondary text-body-lg max-w-md mx-auto leading-relaxed">
                        Thank you for reaching out! We've received your message
                        and will get back to you shortly.
                      </p>
                    </div>
                    <button
                      onClick={() => setSuccess(false)}
                      className="btn btn-secondary btn-lg mt-8 animate-fade-up-3"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      {/* Full Name */}
                      <div className="space-y-2 group/input">
                        <label className="block text-body-sm font-semibold text-text-primary transition-colors group-focus-within/input:text-brand">
                          Your Name
                        </label>
                        <input
                          type="text"
                          placeholder="Arjun Sharma"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={`input w-full bg-bg-base/50 border-border/50 focus:border-brand/50 focus:bg-bg-surface transition-all duration-300 ${fieldErrors.fullName ? "border-destructive/50 focus:border-destructive" : ""}`}
                          disabled={loading}
                        />
                        {fieldErrors.fullName && (
                          <p className="text-destructive text-body-xs mt-1 animate-fade-up-1">
                            {fieldErrors.fullName}
                          </p>
                        )}
                      </div>

                      {/* Email Address */}
                      <div className="space-y-2 group/input">
                        <label className="block text-body-sm font-semibold text-text-primary transition-colors group-focus-within/input:text-brand">
                          Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="arjun@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`input w-full bg-bg-base/50 border-border/50 focus:border-brand/50 focus:bg-bg-surface transition-all duration-300 ${fieldErrors.email ? "border-destructive/50 focus:border-destructive" : ""}`}
                          disabled={loading}
                        />
                        {fieldErrors.email && (
                          <p className="text-destructive text-body-xs mt-1 animate-fade-up-1">
                            {fieldErrors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Topic Select */}
                    <div className="space-y-2 group/input">
                      <label className="block text-body-sm font-semibold text-text-primary transition-colors group-focus-within/input:text-brand">
                        Topic of Discussion
                      </label>
                      <Select
                        value={topic}
                        onChange={setTopic}
                        disabled={loading}
                        options={[
                          { value: "general", label: "General Inquiry" },
                          { value: "bug", label: "Report a Bug / Issue" },
                          { value: "feature", label: "Request a Feature" },
                          { value: "feedback", label: "Product Feedback" },
                        ]}
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-2 group/input">
                      <div className="flex justify-between items-end">
                        <label className="block text-body-sm font-semibold text-text-primary transition-colors group-focus-within/input:text-brand">
                          Your Message
                        </label>
                        {fieldErrors.message && (
                          <span className="text-destructive font-medium text-xs animate-fade-up-1">
                            * Message required
                          </span>
                        )}
                      </div>
                      <textarea
                        placeholder="Tell us what you're thinking or describe the issue in detail..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        className={`input w-full min-h-37.5 resize-y bg-bg-base/50 border-border/50 focus:border-brand/50 focus:bg-bg-surface transition-all duration-300 ${fieldErrors.message ? "border-destructive/50 focus:border-destructive" : ""}`}
                        disabled={loading}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary btn-lg w-full flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform duration-300 shadow-[0_0_20px_rgba(var(--color-brand),0.3)]"
                    >
                      <span>
                        {loading ? "Encrypting & Sending..." : "Send Message"}
                      </span>
                      {!loading && <ArrowRight className="h-5 w-5" />}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Right Column (40%): Social Proof & Interactive Cards */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card bg-bg-surface/40 backdrop-blur-xl border border-white/5 p-8 flex flex-col gap-6 hover:-translate-y-1 transition-transform duration-500 hover:shadow-xl hover:shadow-brand/5">
                <div>
                  <h2 className="font-display text-text-primary text-2xl mb-2">
                    Direct Channels
                  </h2>
                  <p className="text-text-secondary text-body-sm">
                    Prefer immediate platforms? Drop a line directly to the
                    developer.
                  </p>
                </div>

                <div className="space-y-3">
                  <a
                    href="https://github.com/vinayprabhakarx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-bg-base/50 hover:bg-bg-surface hover:border-brand/30 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-brand-subtle text-brand flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GithubIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        GitHub
                      </div>
                      <div className="text-xs text-text-secondary">
                        @vinayprabhakarx
                      </div>
                    </div>
                  </a>

                  <a
                    href="https://linkedin.com/in/vinayprabhakarx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-bg-base/50 hover:bg-bg-surface hover:border-brand/30 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-brand-subtle text-brand flex items-center justify-center group-hover:scale-110 transition-transform">
                      <LinkedinIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        LinkedIn
                      </div>
                      <div className="text-xs text-text-secondary">
                        Connect Professionally
                      </div>
                    </div>
                  </a>

                  <a
                    href="https://vinayprabhakar.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-bg-base/50 hover:bg-bg-surface hover:border-brand/30 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-brand-subtle text-brand flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        Website
                      </div>
                      <div className="text-xs text-text-secondary">
                        vinayprabhakar.dev
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
