import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", fontFamily: "monospace", background: "#fff" }}>
          <h1 style={{ color: "red" }}>App Error — Please report this</h1>
          <pre style={{ background: "#f5f5f5", padding: "20px", borderRadius: "8px", overflow: "auto" }}>
            {this.state.error && this.state.error.toString()}
            {"\n\n"}
            {this.state.error && this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
