import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface NarrativeHeaderProps {
  userName: string;
  dateString: string;
}

export const NarrativeHeader: React.FC<NarrativeHeaderProps> = ({ userName, dateString }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Good morning, {userName}.</Text>
      <Text style={styles.subtext}>Today is {dateString}.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.03,
  },
  subtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
});
export default NarrativeHeader;
