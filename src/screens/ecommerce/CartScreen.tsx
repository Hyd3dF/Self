import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';
import { PRODUCTS } from '../../data/products';
import { haptic } from '../../services/haptics';
import { Trash2 } from 'lucide-react-native';

const CartScreen = () => {
    // Mock cart items (first two products)
    const cartItems = [PRODUCTS[0], PRODUCTS[1]];

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.itemDetails}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={() => haptic.warning()} style={styles.removeButton}>
                <Trash2 color={colors.error} size={20} />
            </TouchableOpacity>
        </View>
    );

    const total = cartItems.reduce((sum, item) => sum + item.price, 0);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Your Cart</Text>
            </View>
            <FlatList
                data={cartItems}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
            />
            <View style={styles.footer}>
                <View style={styles.row}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={() => haptic.success()}
                >
                    <Text style={styles.checkoutText}>Checkout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        ...typography.h1,
        color: colors.text,
    },
    list: {
        padding: spacing.m,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.m,
        padding: spacing.s,
        marginBottom: spacing.m,
        alignItems: 'center',
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.s,
        backgroundColor: colors.surfaceHighlight,
    },
    itemDetails: {
        flex: 1,
        marginLeft: spacing.m,
    },
    name: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    price: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    removeButton: {
        padding: spacing.s,
    },
    footer: {
        padding: spacing.l,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.l,
    },
    totalLabel: {
        ...typography.h2,
        color: colors.textSecondary,
    },
    totalValue: {
        ...typography.h2,
        color: colors.primary,
        fontWeight: 'bold',
    },
    checkoutButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.l,
        paddingVertical: spacing.m,
        alignItems: 'center',
    },
    checkoutText: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text,
    },
});

export default CartScreen;
