"use client";

import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import * as Sentry from "@sentry/nextjs";
import { SectionError } from "./SectionError";

interface Props {
  children: ReactNode;
  /** Custom fallback — receives reset() to retry without a full reload. */
  fallback?: (reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.reset);
      }
      return (
        <SectionError
          title="Что-то пошло не так"
          description="Попробуй ещё раз или перезагрузи страницу"
          onReset={this.reset}
        />
      );
    }
    return this.props.children;
  }
}
