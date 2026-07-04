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
      errs.email = "Email address is required";
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
    } catch (error: any) {
      showToast(
        "error",
        error.response?.data?.message || "Failed to send message. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="relative overflow-hidden">
        {/* Shared ambient glow token */}
        <div className="ambient-glow" />

        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 space-y-20 relative z-10">
          {/* Header Hero Section */}
          <div className="space-y-3 text-center">
            <h1 className="font-display text-text-primary text-[2.75rem] md:text-[4rem] tracking-tight">
              Get in Touch
            </h1>
            <p className="text-text-secondary text-body-md max-w-2xl mx-auto">
              Have questions about statement formats, bug reports, or feature
              ideas? Fill out the form or reach out directly.
            </p>
          </div>

          {/* Double Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            {/* Left Column: Social Connection Links grouped under ONE card (Takes 2/5 width) */}
            <div className="md:col-span-2 card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 space-y-6 self-start text-center md:text-left shadow-sm hover:border-brand/40 transition-all duration-300 hover:shadow-lg">
              <div>
                <h3 className="font-display text-text-primary text-heading-md tracking-tight">
                  Connect Directly
                </h3>
                <p className="text-text-secondary text-body-sm leading-relaxed mt-1">
                  Prefer immediate platforms? Drop a line on any of these
                  channels.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2 justify-center md:justify-start">
                {/* GitHub Profile */}
                <a
                  href="https://github.com/vinayprabhakarx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 w-11 rounded-md border border-border/60 hover:border-brand/40 bg-bg-surface/30 hover:bg-brand-subtle/10 text-text-secondary hover:text-brand flex items-center justify-center transition-all duration-300 group"
                  title="GitHub Profile"
                >
                  <GithubIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
                </a>

                {/* Website */}
                <a
                  href="https://vinayprabhakar.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 w-11 rounded-md border border-border/60 hover:border-brand/40 bg-bg-surface/30 hover:bg-brand-subtle/10 text-text-secondary hover:text-brand flex items-center justify-center transition-all duration-300 group"
                  title="Personal Website"
                >
                  <Globe className="h-5 w-5 transition-transform group-hover:scale-110" />
                </a>

                {/* LinkedIn */}
                <a
                  href="https://linkedin.com/in/vinayprabhakarx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 w-11 rounded-md border border-border/60 hover:border-brand/40 bg-bg-surface/30 hover:bg-brand-subtle/10 text-text-secondary hover:text-brand flex items-center justify-center transition-all duration-300 group"
                  title="LinkedIn"
                >
                  <LinkedinIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
                </a>
              </div>
            </div>

            {/* Right Column: Interactive Contact Form (Takes 3/5 width) */}
            <div className="md:col-span-3 card backdrop-blur-md bg-bg-surface/40 border-border/80 p-8 md:p-10 self-start shadow-sm hover:border-brand/40 transition-all duration-300 hover:shadow-lg">
              {success ? (
                <div className="text-center py-12 space-y-5">
                  <div className="mx-auto h-14 w-14 rounded-full bg-income-bg text-income flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display text-text-primary text-heading-lg">
                      Message Submitted
                    </h3>
                    <p className="text-text-secondary text-body-sm max-w-sm mx-auto leading-relaxed">
                      Thank you! Your message has been received. We will get
                      back to you shortly at the email address provided.
                    </p>
                  </div>
                  <button
                    onClick={() => setSuccess(false)}
                    className="btn btn-secondary btn-md mt-6"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="block text-body-sm font-semibold text-text-secondary">
                        Your Name
                      </label>
                      <input
                        type="text"
                        placeholder="Arjun Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`input ${fieldErrors.fullName ? "input-error" : ""}`}
                        disabled={loading}
                      />
                      {fieldErrors.fullName && (
                        <p className="text-destructive text-body-xs mt-1">
                          {fieldErrors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1">
                      <label className="block text-body-sm font-semibold text-text-secondary">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="arjun@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`input ${fieldErrors.email ? "input-error" : ""}`}
                        disabled={loading}
                      />
                      {fieldErrors.email && (
                        <p className="text-destructive text-body-xs mt-1">
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Topic Select */}
                  <div className="space-y-1">
                    <label className="block text-body-sm font-semibold text-text-secondary">
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
                  <div className="space-y-1">
                    <label className="block text-body-sm font-semibold text-text-secondary justify-between">
                      <span>Your Message</span>
                      {fieldErrors.message && (
                        <span className="text-destructive font-normal text-body-xs">
                          (* Message cannot be empty)
                        </span>
                      )}
                    </label>
                    <textarea
                      placeholder="Tell us what you're thinking or describe the issue in detail..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className={`input min-h-36 resize-y ${fieldErrors.message ? "input-error" : ""}`}
                      disabled={loading}
                    />
                    {fieldErrors.message && (
                      <p className="text-destructive text-body-xs mt-1">
                        {fieldErrors.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2"
                  >
                    <span>
                      {loading ? "Submitting message..." : "Send Message"}
                    </span>
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
