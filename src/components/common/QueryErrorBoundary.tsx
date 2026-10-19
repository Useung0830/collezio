"use client";

import type { ReactNode } from "react";
import { Component } from "react";

type QueryErrorBoundaryProps = {
  children: ReactNode;
  onReset: () => void;
  renderError: (error: Error, retry: () => void) => ReactNode;
};

type QueryErrorBoundaryState = {
  error: Error | null;
};

export default class QueryErrorBoundary extends Component<
  QueryErrorBoundaryProps,
  QueryErrorBoundaryState
> {
  state: QueryErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): QueryErrorBoundaryState {
    return { error };
  }

  private handleRetry = () => {
    this.props.onReset();
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return this.props.renderError(this.state.error, this.handleRetry);
    }
    return this.props.children;
  }
}
