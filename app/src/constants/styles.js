import { StyleSheet, Dimensions } from 'react-native';

export const COLORS = {
  primary: '#0D0120', // Very dark purple
  secondary: '#1A0833',
  accentPurple: '#C030F0',
  accentGreen: '#70FF00',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  glass: 'rgba(255, 255, 255, 0.1)',
  danger: '#FF3B30'
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardContent: {
    padding: 20,
  },
});