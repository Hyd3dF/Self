import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BarChart3, ScanLine, Settings } from 'lucide-react-native';
import { colors } from '../theme/colors';
import HomeScreen from '../screens/ecommerce/HomeScreen';
import AnalysisScreen from '../screens/forex/AnalysisScreen';
import ProfileScreen from '../screens/ecommerce/ProfileScreen';
import { Platform, View, StyleSheet } from 'react-native';
import { haptic } from '../services/haptics';

const Tab = createBottomTabNavigator();

const ECommerceTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#121212', // Slightly flatter dark for premium feel
                    borderTopColor: '#2A2A2A',
                    height: Platform.OS === 'android' ? 64 : 88,
                    paddingBottom: Platform.OS === 'android' ? 12 : 30,
                    paddingTop: 12,
                    elevation: 0, // Remove Android shadow for flat look
                    shadowOpacity: 0, // Remove iOS shadow
                },
                tabBarActiveTintColor: colors.primary, // Gold/Primary
                tabBarInactiveTintColor: '#666666',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                    marginTop: 4,
                },
            }}
        >
            <Tab.Screen
                name="Signals"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
                    tabBarLabel: 'Sinyallerim',
                }}
                listeners={{
                    tabPress: () => haptic.selection(),
                }}
            />
            <Tab.Screen
                name="Analysis"
                component={AnalysisScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={[styles.centerButton, focused && styles.centerButtonFocused]}>
                            <ScanLine color={focused ? "#000" : "#FFF"} size={26} strokeWidth={2.5} />
                        </View>
                    ),
                    tabBarLabel: '',
                }}
                listeners={{
                    tabPress: () => haptic.selection(),
                }}
            />
            <Tab.Screen
                name="Settings"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
                    tabBarLabel: 'Settings',
                }}
                listeners={{
                    tabPress: () => haptic.selection(),
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    centerButton: {
        width: 58,
        height: 58,
        borderRadius: 18, // Squircle / Premium shape
        backgroundColor: '#1E1E1E', // Dark neutral base
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#333',
        // Minimal shadow, no glow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    centerButtonFocused: {
        backgroundColor: colors.primary, // Active state becomes primary color
        borderColor: colors.primary,
        transform: [{ scale: 1.02 }],
    },
});

export default ECommerceTabs;
