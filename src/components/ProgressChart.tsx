import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import Colors from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';

interface BarData {
  label: string;
  value: number;
  secondary?: string;
}

interface ProgressChartProps {
  data: BarData[];
  height?: number;
  barColor?: string;
  emptyColor?: string;
  maxValue?: number;
  unit?: string;
  title?: string;
}

export default function ProgressChart({
  data,
  height = 160,
  barColor: barColorProp,
  emptyColor: emptyColorProp,
  maxValue,
  unit = '',
  title,
}: ProgressChartProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const barColor = barColorProp ?? colors.primary;
  const emptyColor = emptyColorProp ?? colors.cardBorder;
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(20, Math.min(40, (300 - data.length * 4) / data.length));
  const chartWidth = data.length * (barWidth + 8);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={height}>
          {data.map((item, i) => {
            const barHeight = max > 0 ? (item.value / max) * (height - 20) : 0;
            const x = i * (barWidth + 8);
            const y = height - 10 - barHeight;

            return (
              <Rect
                key={i}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                ry={4}
                fill={item.value > 0 ? barColor : emptyColor}
                opacity={item.value > 0 ? 0.85 : 0.3}
              />
            );
          })}
        </Svg>
      </View>
      <View style={styles.labelsRow}>
        {data.map((item, i) => (
          <View
            key={i}
            style={{ width: barWidth, marginHorizontal: 4 }}
          >
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            {item.value > 0 && (
              <Text style={styles.value} numberOfLines={1}>
                {item.value}{unit}
              </Text>
            )}
            {item.secondary && (
              <Text style={styles.secondary} numberOfLines={1}>
                {item.secondary}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: typeof Colors.dark) {
  return StyleSheet.create({
    container: {
      gap: 8,
    },
    title: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    chartWrapper: {
      alignItems: 'center',
    },
    labelsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    label: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: '600',
      textAlign: 'center',
    },
    value: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 2,
    },
    secondary: {
      color: colors.textMuted,
      fontSize: 9,
      textAlign: 'center',
    },
  });
}
