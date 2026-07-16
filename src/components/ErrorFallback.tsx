import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/Colors';

function createStyles(colors: typeof Colors.dark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    icon: {
      marginBottom: 16,
      opacity: 0.6,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 8,
    },
    message: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    buttonText: {
      color: colors.background,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}

export default function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <AlertTriangle size={48} color={colors.accent} style={styles.icon} />
      <Text style={styles.title}>Algo salió mal</Text>
      <Text style={styles.message}>
        {(error instanceof Error ? error.message : String(error)) || 'Ocurrió un error inesperado. Por favor intenta de nuevo.'}
      </Text>
      <Pressable onPress={resetErrorBoundary} style={styles.button}>
        <RefreshCw size={18} color={colors.background} />
        <Text style={styles.buttonText}>Reintentar</Text>
      </Pressable>
    </SafeAreaView>
  );
}
