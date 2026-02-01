import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { haptic } from '../../services/haptics';
import { LogOut, User, Bell, Shield, ChevronRight, Moon, Globe } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';

const ProfileScreen = () => {
    const { logout } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const handleTestNotification = async () => {
        // 1. Permission Check
        const { status } = await Notifications.getPermissionsAsync();

        if (status !== 'granted') {
            const { status: newStatus } = await Notifications.requestPermissionsAsync();
            if (newStatus !== 'granted') {
                alert('Please enable notifications in settings!');
                return;
            }
        }

        // 2. Schedule Test Notification
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "🔔 Notification Test Successful!",
                body: "Your server connection is active. You will hear this sound for trade results.",
                sound: 'default',
            },
            trigger: null, // null = Send immediately
        });
    };

    const handleLogout = () => {
        haptic.medium();
        logout();
    };

    const toggleNotifications = () => {
        haptic.selection();
        setNotificationsEnabled(!notificationsEnabled);
    };

    const MenuItem = ({ icon: Icon, title, onPress, value, isDestructive = false }: any) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
                if (onPress) {
                    haptic.light();
                    onPress();
                }
            }}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={styles.menuIconContainer}>
                <Icon color={isDestructive ? colors.error : colors.text} size={20} />
            </View>
            <Text style={[
                styles.menuTitle,
                isDestructive && { color: colors.error }
            ]}>
                {title}
            </Text>

            {value !== undefined ? (
                value
            ) : (
                <ChevronRight color={colors.textSecondary} size={20} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={{ alignItems: 'center', marginBottom: spacing.m }}>
                    <Image
                        source={require('../../../assets/icon.png')}
                        style={{ width: 80, height: 80, borderRadius: 20 }}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.title}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.sectionHeaderContainer}>
                    <Text style={styles.sectionHeader}>Preferences</Text>
                </View>
                <View style={styles.box}>
                    <MenuItem
                        icon={Bell}
                        title="Push Notifications"
                        onPress={toggleNotifications}
                        value={
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={toggleNotifications}
                                trackColor={{ false: colors.surfaceHighlight, true: colors.primary }}
                                thumbColor={colors.text}
                            />
                        }
                    />
                    <View style={styles.separator} />
                    <MenuItem
                        icon={Bell}
                        title="Test Notification"
                        onPress={handleTestNotification}
                        value={<Text style={[styles.valueText, { color: colors.primary }]}>Test</Text>}
                    />
                    <View style={styles.separator} />
                    <MenuItem icon={Moon} title="Dark Mode" value={<Text style={styles.valueText}>On</Text>} />
                    <View style={styles.separator} />
                    <MenuItem icon={Globe} title="Language" value={<Text style={styles.valueText}>English</Text>} />
                </View>

                <View style={styles.sectionHeaderContainer}>
                    <Text style={styles.sectionHeader}>Account</Text>
                </View>
                <View style={styles.box}>
                    <MenuItem icon={User} title="Personal Details" onPress={() => { }} />
                    <View style={styles.separator} />
                    <MenuItem icon={Shield} title="Security" onPress={() => { }} />
                </View>

                <View style={styles.sectionHeaderContainer}>
                    <Text style={styles.sectionHeader}>Session</Text>
                </View>
                <View style={styles.box}>
                    <TouchableOpacity
                        style={[styles.menuItem, styles.destructiveItem]}
                        onPress={handleLogout}
                    >
                        <View style={styles.menuIconContainer}>
                            <LogOut color={colors.error} size={20} />
                        </View>
                        <Text style={[styles.menuTitle, { color: colors.error }]}>Log Out</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.l,
        paddingBottom: spacing.m,
    },
    title: {
        ...typography.h1,
        color: colors.text,
    },
    scrollContent: {
        paddingHorizontal: spacing.l,
        paddingBottom: spacing.xxl,
    },
    sectionHeaderContainer: {
        marginTop: spacing.l,
        marginBottom: spacing.s,
    },
    sectionHeader: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    box: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        height: 56,
    },
    destructiveItem: {
        // specific styles if needed
    },
    menuIconContainer: {
        marginRight: spacing.m,
        width: 32,
        alignItems: 'center',
    },
    menuTitle: {
        ...typography.body,
        color: colors.text,
        flex: 1,
        fontSize: 16,
    },
    valueText: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    separator: {
        height: 1,
        backgroundColor: colors.surfaceHighlight,
        marginLeft: 56, // Align with text
    },
});

export default ProfileScreen;
