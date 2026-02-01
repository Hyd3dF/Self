import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
    heading: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        letterSpacing: -0.5,
    } as TextStyle,
    subheading: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
    } as TextStyle,
    body: {
        fontSize: 16,
        color: colors.textSecondary,
        lineHeight: 24,
    } as TextStyle,
    caption: {
        fontSize: 12,
        color: colors.textMuted,
    } as TextStyle,
    button: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    } as TextStyle,
};
