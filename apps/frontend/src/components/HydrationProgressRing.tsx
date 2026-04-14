import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Colors, FontSize, FontWeight } from "../theme";

interface Props {
  percentage: number; // 0-100
  totalMl: number;
  goalMl: number;
  size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function HydrationProgressRing({ percentage, totalMl, goalMl, size = 160 }: Props) {
  const isAchieved = totalMl >= goalMl;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: Math.min(percentage, 100),
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: "clamp",
  });

  const ringColor = isAchieved ? Colors.success : Colors.teal;
  const labelColor = isAchieved ? Colors.success : Colors.teal;

  return (
    <View style={styles.container} accessibilityLabel={`Hydration progress: ${Math.min(percentage, 100)} percent. ${totalMl} of ${goalMl} milliliters consumed.`}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={cx} cy={cy} r={radius}
          stroke={Colors.bgElevated}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated progress arc */}
        <AnimatedCircle
          cx={cx} cy={cy} r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>

      {/* Center label */}
      <View style={styles.centerLabel} pointerEvents="none">
        <Text style={styles.dropIcon}>💧</Text>
        <Text style={[styles.mlValue, { color: labelColor }]}>
          {totalMl}
        </Text>
        <Text style={styles.mlUnit}>/ {goalMl} ml</Text>
        {isAchieved && (
          <Text style={styles.achieved}>✅ Done!</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    position: "absolute",
    alignItems: "center",
  },
  dropIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  mlValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  mlUnit: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  achieved: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginTop: 4,
  },
});
