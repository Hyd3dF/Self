import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../../theme/colors';
import { Sparkles, TrendingUp, TrendingDown, Clock } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

// Dummy Data for Social Proof
const DUMMY_SIGNALS = [
    {
        id: '1',
        pair: 'XAUUSD',
        type: 'BUY',
        successRate: 92,
        time: '5m',
        profit: '+120 pips',
        author: 'AI System Alpha',
        timestamp: '2 min ago',
    },
    {
        id: '2',
        pair: 'EURUSD',
        type: 'SELL',
        successRate: 88,
        time: '15m',
        profit: '+45 pips',
        author: 'TraderPro_88',
        timestamp: '12 min ago',
    },
    {
        id: '3',
        pair: 'GBPJPY',
        type: 'BUY',
        successRate: 75,
        time: '15m',
        profit: '+80 pips',
        author: 'LondonSession_Bot',
        timestamp: '45 min ago',
    },
    {
        id: '4',
        pair: 'NAS100',
        type: 'BUY',
        successRate: 95,
        time: '5m',
        profit: '+200 pips',
        author: 'AI System Beta',
        timestamp: '1 hour ago',
    },
];

const CommunityScreen = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate network loading for skeleton effect
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const renderSkeleton = () => (
        <View style={styles.skeletonContainer}>
            {[1, 2, 3].map((key) => (
                <View key={key} style={styles.skeletonCard}>
                    <View style={styles.skeletonHeader} />
                    <View style={styles.skeletonContent} />
                    <View style={styles.skeletonFooter} />
                </View>
            ))}
        </View>
    );

    const renderItem = ({ item, index }: { item: typeof DUMMY_SIGNALS[0], index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100)}
            style={styles.card}
        >
            <View style={styles.cardHeader}>
                <View style={styles.pairContainer}>
                    <View style={styles.iconBadge}>
                        <Sparkles color={colors.primary} size={16} />
                    </View>
                    <Text style={styles.pairText}>{item.pair}</Text>
                    <View style={[styles.badge, item.type === 'BUY' ? styles.buyBadge : styles.sellBadge]}>
                        <Text style={styles.badgeText}>{item.type}</Text>
                    </View>
                </View>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Success Rate</Text>
                    <Text style={[styles.statValue, { color: colors.success }]}>{item.successRate}%</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Timeframe</Text>
                    <Text style={styles.statValue}>{item.time}</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Potential</Text>
                    <Text style={[styles.statValue, { color: colors.primary }]}>{item.profit}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.authorRow}>
                    <View style={styles.authorAvatar}>
                        <Text style={styles.avatarText}>{item.author[0]}</Text>
                    </View>
                    <Text style={styles.authorName}>{item.author}</Text>
                </View>
            </View>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Discover Opportunities</Text>
                <Text style={styles.headerSubtitle}>Live signals from AI & Top Traders</Text>
            </View>

            {loading ? (
                renderSkeleton()
            ) : (
                <FlatList
                    data={DUMMY_SIGNALS}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
    },
    headerTitle: {
        ...typography.h1,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    headerSubtitle: {
        ...typography.body,
        color: colors.textSecondary,
    },
    list: {
        padding: spacing.m,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    pairContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    iconBadge: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.s,
        backgroundColor: colors.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pairText: {
        ...typography.h2,
        fontSize: 18,
        color: colors.text,
    },
    badge: {
        paddingHorizontal: spacing.s,
        paddingVertical: 4,
        borderRadius: borderRadius.s,
    },
    buyBadge: {
        backgroundColor: 'rgba(0, 245, 160, 0.15)',
    },
    sellBadge: {
        backgroundColor: 'rgba(255, 59, 105, 0.15)',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.text,
    },
    timestamp: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.m,
        backgroundColor: colors.surfaceHighlight,
        padding: spacing.m,
        borderRadius: borderRadius.m,
    },
    stat: {
        alignItems: 'center',
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    authorAvatar: {
        width: 24,
        height: 24,
        borderRadius: borderRadius.round,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.text,
    },
    authorName: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    // Skeleton Styles
    skeletonContainer: {
        padding: spacing.m,
    },
    skeletonCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.m,
        height: 180,
        opacity: 0.5,
    },
    skeletonHeader: {
        height: 32,
        backgroundColor: colors.surfaceHighlight,
        marginBottom: spacing.m,
        borderRadius: borderRadius.s,
        width: '60%',
    },
    skeletonContent: {
        height: 60,
        backgroundColor: colors.surfaceHighlight,
        marginBottom: spacing.m,
        borderRadius: borderRadius.m,
    },
    skeletonFooter: {
        height: 20,
        backgroundColor: colors.surfaceHighlight,
        borderRadius: borderRadius.s,
        width: '40%',
    },
});

export default CommunityScreen;
