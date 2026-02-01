import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';
import { Product } from '../../data/products';
import { haptic } from '../../services/haptics';
import { ArrowLeft, Heart, ShoppingCart } from 'lucide-react-native';

const ProductDetailScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { product } = route.params as { product: Product };

    const handleAddToCart = () => {
        haptic.success();
        // TODO: Add to cart logic
        console.log('Added to cart:', product.name);
    };

    return (
        <View style={styles.container}>
            <Image source={{ uri: product.image }} style={styles.image} />

            <SafeAreaView style={styles.header} edges={['top']}>
                <TouchableOpacity
                    onPress={() => {
                        haptic.light();
                        navigation.goBack();
                    }}
                    style={styles.iconButton}
                >
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => haptic.medium()}
                    style={styles.iconButton}
                >
                    <Heart color={colors.text} size={24} />
                </TouchableOpacity>
            </SafeAreaView>

            <View style={styles.detailsContainer}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.content}>
                        <Text style={styles.name}>{product.name}</Text>
                        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
                        <View style={styles.separator} />
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.description}>{product.description}</Text>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.addToCartButton}
                        onPress={handleAddToCart}
                    >
                        <ShoppingCart color={colors.inverse || '#000'} size={20} />
                        <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    image: {
        width: '100%',
        height: '50%',
        resizeMode: 'cover',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.m,
        paddingTop: spacing.s,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.round,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailsContainer: {
        flex: 1,
        marginTop: -24,
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    content: {
        padding: spacing.l,
    },
    name: {
        ...typography.h2,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    price: {
        ...typography.h2,
        color: colors.primary,
        marginBottom: spacing.l,
    },
    separator: {
        height: 1,
        backgroundColor: colors.border,
        marginBottom: spacing.m,
    },
    sectionTitle: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.s,
    },
    description: {
        ...typography.body,
        color: colors.textSecondary,
        lineHeight: 24,
    },
    footer: {
        padding: spacing.l,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
    },
    addToCartButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.l,
        paddingVertical: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.s,
    },
    addToCartText: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text,
    },
});

export default ProductDetailScreen;
