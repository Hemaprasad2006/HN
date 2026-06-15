import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface PlantCardProps {
  id: string;
  name: string;
  streak: number;
  isCompleted: boolean;
  onToggle: (id: string, name: string) => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({ id, name, streak, isCompleted, onToggle }) => {
  const scale = useSharedValue(1);

  const getPlantEmoji = () => {
    if (isCompleted) {
      if (streak <= 2) return '🌿'; // Sprout
      if (streak <= 6) return '🪴'; // Potted Plant
      if (streak <= 14) return '🌳'; // Deciduous Tree
      return '🌲'; // Ancient Evergreen
    } else {
      if (streak === 0) return '🥀'; // Wilted/missed
      if (streak <= 2) return '🌿';
      if (streak <= 6) return '🪴';
      if (streak <= 14) return '🌳';
      return '🌲';
    }
  };

  const getPlantStageName = () => {
    if (!isCompleted && streak === 0) return 'Wilted';
    if (streak <= 0) return 'Seedling';
    if (streak <= 2) return 'Sprout';
    if (streak <= 6) return 'Potted';
    if (streak <= 14) return 'Deciduous';
    return 'Evergreen';
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    scale.value = 0.88;
    scale.value = withSpring(1.08, { damping: 5 }, () => {
      scale.value = withSpring(1);
    });
    onToggle(id, name);
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={[styles.card, isCompleted && styles.completedCard]}>
      <View>
        <Text style={styles.category}>DAILY HABIT</Text>
        <Text style={[styles.title, isCompleted && styles.completedTitle]}>{name}</Text>
        <Text style={styles.streak}>🔥 {streak}d streak</Text>
      </View>
      
      <Animated.View style={[styles.emojiContainer, animatedStyle, isCompleted && styles.completedEmojiContainer]}>
        <Text style={styles.emoji}>{getPlantEmoji()}</Text>
        <Text style={[styles.stageName, isCompleted && styles.completedStageName]}>{getPlantStageName()}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#121826',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 16,
    width: '48%',
    minHeight: 180,
    justifyContent: 'space-between',
  },
  completedCard: {
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  category: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 4,
  },
  completedTitle: {
    color: '#22C55E',
    textDecorationLine: 'line-through',
    opacity: 0.8,
  },
  streak: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  emojiContainer: {
    alignSelf: 'center',
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
  },
  completedEmojiContainer: {
    backgroundColor: 'rgba(34,197,94,0.05)',
    borderColor: 'rgba(34,197,94,0.1)',
  },
  emoji: {
    fontSize: 28,
  },
  stageName: {
    fontSize: 8,
    color: '#64748B',
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  completedStageName: {
    color: '#22C55E',
  },
});
export default PlantCard;
