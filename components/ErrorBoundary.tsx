"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a0a2e 0%, #0a0010 100%)",
          color: "#fff",
          fontFamily: "monospace",
          padding: 20,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 24, marginBottom: 12, color: "#ff6b6b" }}>Algo correu mal</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
            Por favor, recarrega a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 32px",
              background: "linear-gradient(135deg, #7b2ff7, #aa55ff)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
