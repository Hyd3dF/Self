import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    Alert,
    Modal,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../../theme/colors';
import { Signal, getSignalImageUrl, getSignalTimeText } from '../../data/Signal';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, X, Download, Zap, Timer, Target } from 'lucide-react-native';
import { haptic } from '../../services/haptics';
// @ts-ignore - using legacy API for SDK 54 compatibility
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

const POCKETBASE_URL = 'http://pocketbase-v4okssck4c0s4ccowkoowccs.91.99.182.76.sslip.io';
const { width, height } = Dimensions.get('window');

type RootStackParamList = {
    SignalDetail: { signal: Signal };
};

type SignalDetailRouteProp = RouteProp<RootStackParamList, 'SignalDetail'>;

interface SignalUser {
    id: string;
    or: string;
    userprofile?: string;
}

// Soft, professional colors for price levels
const PRICE_COLORS = {
    entry: '#FFFFFF',
    target: '#4ECCA3',  // Soft mint green
    stop: '#FF6B6B',    // Soft coral red
};

const SignalDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<SignalDetailRouteProp>();
    const { signal } = route.params;
    const { pb } = useAuth();

    const [signalUser, setSignalUser] = useState<SignalUser | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lightboxVisible, setLightboxVisible] = useState(false);

    const imageUrl = getSignalImageUrl(signal, POCKETBASE_URL);

    useEffect(() => {
        const fetchUser = async () => {
            if (!signal.user) {
                setLoadingUser(false);
                return;
            }
            try {
                const userData = await pb.collection('deneme').getOne(signal.user);
                setSignalUser({
                    id: userData.id,
                    or: userData.or || 'Anonim',
                    userprofile: userData.userprofile,
                });
            } catch (error) {
                console.error('Error fetching signal user:', error);
            } finally {
                setLoadingUser(false);
            }
        };
        fetchUser();
    }, [signal.user, pb]);

    const getUserAvatarUrl = () => {
        if (!signalUser?.userprofile) return null;
        return `${POCKETBASE_URL}/api/files/deneme/${signalUser.id}/${signalUser.userprofile}`;
    };

    const avatarUrl = getUserAvatarUrl();

    // Open lightbox
    const openLightbox = () => {
        haptic.light();
        setLightboxVisible(true);
    };

    // Close lightbox
    const closeLightbox = () => {
        haptic.light();
        setLightboxVisible(false);
    };

    // Download image to gallery
    const handleImageDownload = async () => {
        if (!imageUrl || saving) return;

        haptic.medium();
        setSaving(true);

        try {
            // Request permission
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('İzin Gerekli', 'Fotoğrafı kaydetmek için galeri izni gerekiyor.');
                setSaving(false);
                return;
            }

            // Download to cache
            const filename = `Signal_${signal.pair}_${Date.now()}.jpg`;
            const fileUri = FileSystem.cacheDirectory + filename;

            const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);

            if (downloadResult.status === 200) {
                // Save to gallery
                await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
                Alert.alert('Başarılı', 'Grafik galeriye kaydedildi.');
            } else {
                Alert.alert('Hata', 'Grafik indirilemedi.');
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Hata', 'Grafik kaydedilirken bir sorun oluştu.');
        } finally {
            setSaving(false);
        }
    };

    // Direction display
    const isBuy = signal.direction === 'BUY';
    const directionLabel = isBuy ? 'BUY' : 'SELL';
    const directionColor = isBuy ? PRICE_COLORS.target : PRICE_COLORS.stop;

    // Risk/Reward calculation
    const calculateRiskReward = () => {
        if (!signal.entry_price || !signal.tp_price || !signal.sl_price) return null;
        const risk = Math.abs(signal.entry_price - signal.sl_price);
        const reward = Math.abs(signal.tp_price - signal.entry_price);
        if (risk === 0) return null;
        return (reward / risk).toFixed(2);
    };

    const riskReward = calculateRiskReward();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => { haptic.light(); navigation.goBack(); }}
                    activeOpacity={0.7}
                >
                    <ArrowLeft color={colors.text} size={22} />
                </TouchableOpacity>

                {/* Minimal User Profile */}
                {!loadingUser && (
                    <View style={styles.headerUser}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
                        ) : (
                            <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
                                <Text style={styles.headerAvatarText}>{(signalUser?.or || 'A').charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                        <Text style={styles.headerUserName}>{signalUser?.or || 'Analist'}</Text>
                    </View>
                )}

                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Title Section - Elegant & Clean */}
                <View style={styles.titleSection}>
                    <Text style={styles.pairName}>{signal.pair}</Text>
                    <View style={styles.directionRow}>
                        <Text style={[styles.directionLabel, { color: directionColor }]}>{directionLabel}</Text>
                        <View style={styles.timeDot} />
                        <Text style={styles.timeText}>{getSignalTimeText(signal)}</Text>
                    </View>
                </View>

                {/* Chart Image - Tap to open Lightbox */}
                {imageUrl && (
                    <TouchableOpacity
                        style={styles.chartContainer}
                        activeOpacity={0.9}
                        onPress={openLightbox}
                    >
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.chartImage}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                )}

                {/* Price Levels - Spacious, Centered, Soft Colors */}
                <View style={styles.priceLevelsContainer}>
                    <View style={styles.priceItem}>
                        <Text style={styles.priceLabel}>GİRİŞ</Text>
                        <Text style={[styles.priceValue, { color: PRICE_COLORS.entry }]}>
                            {signal.entry_price || '-'}
                        </Text>
                    </View>

                    <View style={styles.priceItem}>
                        <Text style={[styles.priceLabel, { color: PRICE_COLORS.target }]}>HEDEF</Text>
                        <Text style={[styles.priceValue, { color: PRICE_COLORS.target }]}>
                            {signal.tp_price || '-'}
                        </Text>
                    </View>

                    <View style={styles.priceItem}>
                        <Text style={[styles.priceLabel, { color: PRICE_COLORS.stop }]}>STOP</Text>
                        <Text style={[styles.priceValue, { color: PRICE_COLORS.stop }]}>
                            {signal.sl_price || '-'}
                        </Text>
                    </View>
                </View>

                {/* Secondary Info - Minimal Pills */}
                <View style={styles.metaRow}>
                    {signal.timeframe && (
                        <View style={styles.metaPill}>
                            <Timer size={12} color={colors.textSecondary} />
                            <Text style={styles.metaText}>{signal.timeframe}</Text>
                        </View>
                    )}
                    {riskReward && (
                        <View style={styles.metaPill}>
                            <Target size={12} color={colors.textSecondary} />
                            <Text style={styles.metaText}>R:R 1:{riskReward}</Text>
                        </View>
                    )}
                </View>

                {/* AI Analysis - Clean Card */}
                {signal.analysis_note && (
                    <View style={styles.analysisCard}>
                        <View style={styles.analysisHeader}>
                            <Zap size={16} color={colors.primary} />
                            <Text style={styles.analysisTitle}>AI Analizi</Text>
                        </View>
                        <Text style={styles.analysisText}>{signal.analysis_note}</Text>
                    </View>
                )}

                {/* Bottom Spacer */}
                <View style={{ height: 40 }} />

            </ScrollView>

            {/* Fullscreen Lightbox Modal */}
            <Modal
                visible={lightboxVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeLightbox}
                statusBarTranslucent={true}
            >
                <View style={styles.lightboxContainer}>
                    <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />

                    {/* Top Bar with Close and Download buttons */}
                    <SafeAreaView style={styles.lightboxTopBar} edges={['top']}>
                        <TouchableOpacity
                            style={styles.lightboxButton}
                            onPress={closeLightbox}
                            activeOpacity={0.7}
                        >
                            <X color="#FFFFFF" size={24} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.lightboxButton}
                            onPress={handleImageDownload}
                            activeOpacity={0.7}
                            disabled={saving}
                        >
                            <Download color={saving ? colors.textMuted : "#FFFFFF"} size={24} />
                        </TouchableOpacity>
                    </SafeAreaView>

                    {/* Centered Image */}
                    <View style={styles.lightboxImageWrapper}>
                        <Image
                            source={{ uri: imageUrl || '' }}
                            style={styles.lightboxImage}
                            resizeMode="contain"
                        />
                        {saving && (
                            <View style={styles.lightboxSavingOverlay}>
                                <Text style={styles.lightboxSavingText}>Kaydediliyor...</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.m,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerUser: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    headerAvatarFallback: {
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerAvatarText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFF',
    },
    headerUserName: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    scrollContent: {
        paddingBottom: spacing.xxl,
    },

    // Title Section
    titleSection: {
        alignItems: 'center',
        marginTop: spacing.xl,
        marginBottom: spacing.xl,
    },
    pairName: {
        fontSize: 28,
        fontWeight: '600',
        color: colors.text,
        letterSpacing: 1,
        marginBottom: 10,
    },
    directionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    directionLabel: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
    timeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.textMuted,
    },
    timeText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '400',
    },

    // Chart
    chartContainer: {
        width: '100%',
        aspectRatio: 16 / 10,
        backgroundColor: '#0A0A0A',
        marginBottom: spacing.xxl,
    },
    chartImage: {
        width: '100%',
        height: '100%',
    },

    // Price Levels
    priceLevelsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: spacing.l,
        marginBottom: spacing.xl,
    },
    priceItem: {
        alignItems: 'center',
        minWidth: 80,
    },
    priceLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: colors.textMuted,
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    priceValue: {
        fontSize: 20,
        fontWeight: '500',
        fontVariant: ['tabular-nums'],
    },

    // Meta Pills
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.l,
        marginBottom: spacing.xxl,
    },
    metaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 20,
    },
    metaText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
    },

    // AI Analysis Card
    analysisCard: {
        marginHorizontal: spacing.l,
        padding: spacing.l,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: borderRadius.m,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    analysisHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    analysisTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    analysisText: {
        fontSize: 14,
        lineHeight: 24,
        color: colors.textSecondary,
        fontWeight: '400',
    },

    // Lightbox Modal
    lightboxContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.97)',
    },
    lightboxTopBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
    },
    lightboxButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lightboxImageWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lightboxImage: {
        width: width,
        height: height * 0.7,
    },
    lightboxSavingOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    lightboxSavingText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default SignalDetailScreen;
