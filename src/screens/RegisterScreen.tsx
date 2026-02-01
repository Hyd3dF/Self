import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, User, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { haptic } from '../services/haptics';

export const RegisterScreen = ({ navigation }: { navigation: any }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        haptic.medium();
        setIsLoading(true);

        const result = await register({
            or: name.trim(),
            email: email.trim(),
            password: password,
            explanation: '',
        });

        setIsLoading(false);

        if (!result.success) {
            haptic.error();
            Alert.alert('Registration Failed', result.error || 'Could not create account.');
        } else {
            haptic.success();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            <View style={styles.headerBar}>
                <TouchableOpacity
                    onPress={() => {
                        haptic.light();
                        navigation.goBack();
                    }}
                    style={styles.backButton}
                >
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Sign up to get started</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputContainer}>
                                <User color={colors.textSecondary} size={20} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your name"
                                    placeholderTextColor={colors.textMuted}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputContainer}>
                                <Mail color={colors.textSecondary} size={20} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    placeholderTextColor={colors.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputContainer}>
                                <Lock color={colors.textSecondary} size={20} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Create a password"
                                    placeholderTextColor={colors.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={colors.text} />
                            ) : (
                                <>
                                    <Text style={styles.buttonText}>Sign Up</Text>
                                    <ArrowRight color={colors.text} size={20} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => {
                            haptic.selection();
                            navigation.goBack();
                        }}>
                            <Text style={styles.link}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerBar: {
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.m,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.m,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.xl,
    },
    header: {
        marginVertical: spacing.xl,
    },
    title: {
        ...typography.h1,
        color: colors.text,
        marginBottom: spacing.s,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
    },
    form: {
        gap: spacing.l,
    },
    inputGroup: {
        gap: spacing.s,
    },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.m,
        paddingHorizontal: spacing.m,
        height: 56,
        gap: spacing.m,
    },
    input: {
        flex: 1,
        color: colors.text,
        fontSize: 16,
        height: '100%',
    },
    button: {
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: borderRadius.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.m,
        gap: spacing.s,
    },
    buttonText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
        marginBottom: spacing.xl,
    },
    footerText: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    link: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
});
