/**
 * Top-level React error boundary. Without this, any uncaught render error
 * leaves the user staring at a blank screen with no feedback (especially on
 * web where there's no native crash UI). Catches errors, shows a readable
 * fallback, and offers a reload button.
 */
import { Component, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface State {
  error: Error | null;
  info: string | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: null };
  }

  override componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info?.componentStack);
    this.setState({ error, info: info?.componentStack ?? null });
  }

  handleReload = () => {
    this.setState({ error: null, info: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  override render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0A0A14' }}
        contentContainerStyle={{ padding: 24, paddingTop: 64 }}
      >
        <Text style={{ fontSize: 32, color: '#7C7BFF' }}>✦</Text>
        <Text
          style={{
            marginTop: 12,
            fontSize: 22,
            fontWeight: '700',
            color: '#FFFFFF',
          }}
        >
          Something broke
        </Text>
        <Text style={{ marginTop: 8, fontSize: 13, color: '#9CA3AF' }}>
          RideAI hit an error it couldn&apos;t recover from. Reload the app to try again. If it keeps happening, the details below help us fix it.
        </Text>

        <View
          style={{
            marginTop: 20,
            padding: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(239,68,68,0.3)',
            backgroundColor: 'rgba(239,68,68,0.08)',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: '#EF4444',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Error
          </Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: '#FCA5A5' }}>
            {error.message}
          </Text>
          {info ? (
            <Text
              style={{
                marginTop: 12,
                fontSize: 11,
                color: '#9CA3AF',
                fontFamily: 'monospace',
              }}
            >
              {info.split('\n').slice(0, 8).join('\n')}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={this.handleReload}
          style={{
            marginTop: 24,
            backgroundColor: '#7C7BFF',
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>
            Reload app
          </Text>
        </Pressable>
      </ScrollView>
    );
  }
}
