import { Component, type ReactNode } from 'react'
import { DataState } from './data-state'
export class ErrorBoundary extends Component<{ children: ReactNode; label?: string }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <DataState title={this.props.label ?? '화면을 표시하지 못했습니다'} message="일시적인 오류가 발생했습니다. 다시 시도해 주세요." retry={() => this.setState({ failed: false })} />
    return this.props.children
  }
}
