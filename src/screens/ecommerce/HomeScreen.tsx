import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';
import { haptic } from '../../services/haptics';
import { useAuth } from '../../context/AuthContext';
import { Signal, getSignalImageUrl, getSignalTimeText } from '../../data/Signal';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, User } from 'lucide-react-native';

const POCKETBASE_URL = 'http://pocketbase-v4okssck4c0s4ccowkoowccs.91.99.182.76.sslip.io';

const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const { user, pb } = useAuth();
    const [signals, setSignals] = useState<Signal[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userCache, setUserCache] = useState<Record<string, { or: string; userprofile?: string }>>({});

    // Fetch user data for a signal
    const fetchUserData = useCallback(async (userId: string) => {
        if (!userId || userCache[userId]) return;
        try {
            const userData = await pb.collection('deneme').getOne(userId);
            setUserCache(prev => ({
                ...prev,
                [userId]: {
                    or: userData.or || 'Anonim',
                    userprofile: userData.userprofile,
                }
            }));
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }, [userCache, pb]);

    // Fetch users for all signals
    useEffect(() => {
        signals.forEach(signal => {
            if (signal.user && !userCache[signal.user]) {
                fetchUserData(signal.user);
            }
        });
    }, [signals, userCache, fetchUserData]);

    // Get user avatar URL
    const getUserAvatarUrl = (userId: string) => {
        const userData = userCache[userId];
        if (!userData?.userprofile) return null;
        return `${POCKETBASE_URL}/api/files/deneme/${userId}/${userData.userprofile}`;
    };

    const fetchSignals = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        console.log('Fetching signals for user:', user.id);

        try {
            // APPROACH 1: Fetch all signals without filter or sort
            // This avoids potential relation field and sort issues in PocketBase
            const records = await pb.collection('signals').getList(1, 100);

            console.log(`Fetched ${records.items.length} total signals from DB`);

            // Filter to current user's signals client-side
            const userSignals = records.items.filter((item: any) => item.user === user.id);
            console.log(`Filtered to ${userSignals.length} signals for current user`);

            const mappedSignals: Signal[] = userSignals.map((item: any) => ({
                id: item.id,
                user: item.user,
                pair: item.pair,
                timeframe: item.timeframe,
                direction: item.direction,
                entry_price: parseFloat(item.entry_price) || 0,
                tp_price: parseFloat(item.tp_price) || 0,
                sl_price: parseFloat(item.sl_price) || 0,
                status: item.status,
                analysis_note: item.analysis_note,
                chart_image: item.chart_image,
                created: item.created,
                updated: item.updated,
                started_at: item.started_at,
                ended_at: item.ended_at,
                collectionId: item.collectionId,
                collectionName: item.collectionName,
            }));

            setSignals(mappedSignals);
        } catch (error: any) {
            console.error('Error fetching signals:', error);
            console.error('Error status:', error?.status);
            console.error('Error response:', JSON.stringify(error?.response || error?.data || {}));
            console.error('Full error object:', JSON.stringify(error, null, 2));

            // Check if it's an API Rules issue
            if (error?.status === 400) {
                console.log('400 Error - Possible causes:');
                console.log('1. API Rules blocking List/Search on signals collection');
                console.log('2. Collection schema issue (invalid field types)');
                console.log('3. Sort field does not exist');
            }

            // Attempt without any options (most basic query)
            try {
                console.log('Attempting basic fetch without any options...');
                const basicRecords = await pb.collection('signals').getList(1, 50);
                console.log('Basic fetch succeeded:', basicRecords.items.length, 'items');

                const userSignals = basicRecords.items.filter((item: any) => item.user === user.id);
                const mappedSignals: Signal[] = userSignals.map((item: any) => ({
                    id: item.id,
                    user: item.user,
                    pair: item.pair,
                    timeframe: item.timeframe,
                    direction: item.direction,
                    entry_price: parseFloat(item.entry_price) || 0,
                    tp_price: parseFloat(item.tp_price) || 0,
                    sl_price: parseFloat(item.sl_price) || 0,
                    status: item.status,
                    analysis_note: item.analysis_note,
                    chart_image: item.chart_image,
                    created: item.created,
                    updated: item.updated,
                    collectionId: item.collectionId,
                    collectionName: item.collectionName,
                }));
                setSignals(mappedSignals);
            } catch (basicError: any) {
                console.error('Basic fetch failed:', basicError);
                console.error('Basic error details:', JSON.stringify(basicError?.data || basicError?.response || {}));

                // If even basic fetch fails, the issue is with API Rules
                console.log('SOLUTION: Go to PocketBase Admin -> signals collection -> API Rules');
                console.log('Set "List/Search rule" to empty (allow all) or @request.auth.id != ""');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id, pb]);

    useEffect(() => {
        fetchSignals();
    }, [fetchSignals]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        haptic.light();
        fetchSignals();
    }, [fetchSignals]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'WON':
                return { color: colors.success, icon: CheckCircle, label: 'Kazandı', bgColor: 'rgba(0, 200, 100, 0.15)' };
            case 'LOST':
                return { color: colors.error || '#FF5252', icon: XCircle, label: 'Kaybetti', bgColor: 'rgba(255, 80, 80, 0.15)' };
            default:
                return { color: colors.warning || '#FFB800', icon: Clock, label: 'Bekliyor', bgColor: 'rgba(255, 184, 0, 0.15)' };
        }
    };

    const renderSignal = ({ item }: { item: Signal }) => {
        const statusConfig = getStatusConfig(item.status);
        const StatusIcon = statusConfig.icon;
        const imageUrl = getSignalImageUrl(item, POCKETBASE_URL);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => {
                    haptic.selection();
                    navigation.navigate('SignalDetail', { signal: item });
                }}
                activeOpacity={0.9}
            >
                {/* Chart Image */}
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.image} />
                ) : (
                    <View style={[styles.image, styles.imagePlaceholder]}>
                        <Text style={styles.placeholderText}>No Image</Text>
                    </View>
                )}

                {/* Direction Badge */}
                <View style={[styles.directionBadge, item.direction === 'BUY' ? styles.buyBadge : styles.sellBadge]}>
                    {item.direction === 'BUY' ? (
                        <TrendingUp color="#FFF" size={14} />
                    ) : (
                        <TrendingDown color="#FFF" size={14} />
                    )}
                    <Text style={styles.directionText}>{item.direction}</Text>
                </View>

                {/* Info Section */}
                <View style={styles.info}>
                    <View style={styles.headerRow}>
                        <Text style={styles.pair}>{item.pair}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                            <StatusIcon color={statusConfig.color} size={12} />
                            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                        </View>
                    </View>

                    {/* Prices */}
                    <View style={styles.priceRow}>
                        <View style={styles.priceItem}>
                            <Text style={styles.priceLabel}>Entry</Text>
                            <Text style={styles.priceValue}>{item.entry_price || '-'}</Text>
                        </View>
                        <View style={styles.priceItem}>
                            <Text style={styles.priceLabel}>TP</Text>
                            <Text style={[styles.priceValue, styles.tpColor]}>{item.tp_price || '-'}</Text>
                        </View>
                        <View style={styles.priceItem}>
                            <Text style={styles.priceLabel}>SL</Text>
                            <Text style={[styles.priceValue, styles.slColor]}>{item.sl_price || '-'}</Text>
                        </View>
                    </View>

                    {/* Timeframe & Time Info */}
                    <View style={styles.footerRow}>
                        <Text style={styles.timeframe}>{item.timeframe}</Text>
                        <Text style={styles.timeText}>{getSignalTimeText(item)}</Text>
                    </View>

                    {/* Analyst Info */}
                    <View style={styles.analystRow}>
                        {getUserAvatarUrl(item.user) ? (
                            <Image
                                source={{ uri: getUserAvatarUrl(item.user)! }}
                                style={styles.analystAvatar}
                            />
                        ) : (
                            <View style={styles.analystAvatarInitial}>
                                <Text style={styles.analystInitialText}>
                                    {(userCache[item.user]?.or || 'A').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <Text style={styles.analystName}>
                            {userCache[item.user]?.or || 'Yükleniyor...'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <Clock color={colors.textSecondary} size={48} />
            <Text style={styles.emptyTitle}>Henüz Sinyal Yok</Text>
            <Text style={styles.emptySubtitle}>
                Analiz sekmesinden bir grafik yükleyin ve AI tahminini kaydedin.
            </Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Sinyallerim</Text>
                <Text style={styles.subtitle}>{signals.length} aktif sinyal</Text>
            </View>
            <FlatList
                data={signals}
                renderItem={renderSignal}
                keyExtractor={item => item.id}
                contentContainerStyle={signals.length === 0 ? styles.emptyList : styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={EmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.l,
    },
    title: {
        ...typography.h1,
        color: colors.text,
    },
    subtitle: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 4,
    },
    list: {
        paddingHorizontal: spacing.m,
        paddingBottom: spacing.xxl,
    },
    emptyList: {
        flex: 1,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        marginBottom: spacing.m,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    image: {
        width: '100%',
        height: 160,
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        backgroundColor: colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    directionBadge: {
        position: 'absolute',
        top: spacing.s,
        left: spacing.s,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.s,
        paddingVertical: 4,
        borderRadius: borderRadius.s,
        gap: 4,
    },
    buyBadge: {
        backgroundColor: 'rgba(0, 200, 100, 0.9)',
    },
    sellBadge: {
        backgroundColor: 'rgba(255, 80, 80, 0.9)',
    },
    directionText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    info: {
        padding: spacing.m,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    pair: {
        ...typography.h2,
        fontSize: 18,
        color: colors.text,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.s,
        paddingVertical: 4,
        borderRadius: borderRadius.s,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.s,
        paddingVertical: spacing.s,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    priceItem: {
        alignItems: 'center',
        flex: 1,
    },
    priceLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text,
    },
    tpColor: {
        color: colors.success,
    },
    slColor: {
        color: colors.error || '#FF5252',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeframe: {
        fontSize: 12,
        color: colors.textSecondary,
        backgroundColor: colors.surfaceHighlight,
        paddingHorizontal: spacing.s,
        paddingVertical: 2,
        borderRadius: borderRadius.s,
    },
    date: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    timeText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyTitle: {
        ...typography.h2,
        color: colors.text,
        marginTop: spacing.m,
        marginBottom: spacing.s,
    },
    emptySubtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    analystRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.m,
        paddingTop: spacing.m,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    analystAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    analystAvatarPlaceholder: {
        backgroundColor: colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    analystAvatarInitial: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    analystInitialText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    analystName: {
        fontSize: 13,
        color: colors.text,
        marginLeft: spacing.s,
        fontWeight: '500',
    },
});

export default HomeScreen;
