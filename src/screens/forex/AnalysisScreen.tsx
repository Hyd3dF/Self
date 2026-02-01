import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Modal, Alert, Platform, TextInput, ImageStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../../theme/colors';
import { Upload, X, Maximize2, Play, LayoutGrid, Clock, Globe, Plus, Lock, Search, Trash2, AlertTriangle, ShieldAlert, Save, CheckCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { haptic } from '../../services/haptics';
import { FOREX_PAIRS } from '../../data/forexPairs';


const TIMEFRAMES = [
    { label: 'Short Term (5m)', value: '5m' },
    { label: 'Mid Term (15m)', value: '15m' }
];
const SESSIONS = ['London', 'New York', 'Tokyo'];

// Interface for parsed signal data
interface ParsedSignal {
    direction: 'BUY' | 'SELL';
    entry_price: number;
    tp_price: number;
    sl_price: number;
    analysis_note: string;
}

const AnalysisScreen = () => {
    const { user, pb } = useAuth();
    const [image, setImage] = useState<string | null>(null);
    const [imageUri, setImageUri] = useState<string | null>(null);

    const [visibleAssets, setVisibleAssets] = useState<string[]>(['XAUUSD']);
    const [selectedAsset, setSelectedAsset] = useState<string>('XAUUSD');

    const [timeframe, setTimeframe] = useState('15m');
    const [session, setSession] = useState('New York');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Currency Search State
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Warning Modal State
    const [warningVisible, setWarningVisible] = useState(false);
    const [warningMessage, setWarningMessage] = useState({ title: '', message: '' });

    // Parsed Signal State (for save functionality)
    const [parsedSignal, setParsedSignal] = useState<ParsedSignal | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const pickImage = async () => {
        haptic.light();
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
            setImageUri(result.assets[0].uri);
            haptic.success();
        }
    };

    // Parse AI response to extract signal data - handles text-based formats
    const parseAIResponse = (data: any): ParsedSignal => {
        // Get the text content from various possible fields
        const textContent = data.output || data.text || data.analysis || data.message || JSON.stringify(data);
        const textUpper = textContent.toUpperCase();

        // Extract direction - look for BUY or SELL in text
        let direction: 'BUY' | 'SELL' = 'BUY';
        if (data.direction) {
            direction = data.direction.toUpperCase() === 'SELL' ? 'SELL' : 'BUY';
        } else if (textUpper.includes('SIGNAL: SELL') || textUpper.includes('TRADING SIGNAL: SELL')) {
            direction = 'SELL';
        } else if (textUpper.includes('SIGNAL: BUY') || textUpper.includes('TRADING SIGNAL: BUY')) {
            direction = 'BUY';
        } else if (textUpper.includes('SELL')) {
            direction = 'SELL';
        }

        // Extract prices using regex patterns
        // Matches patterns like: "Entry Price:** 1960" or "Entry: 1960" or "entry_price: 1960"
        const extractPrice = (patterns: RegExp[]): number => {
            for (const pattern of patterns) {
                const match = textContent.match(pattern);
                if (match && match[1]) {
                    const price = parseFloat(match[1].replace(/,/g, ''));
                    if (!isNaN(price) && price > 0) return price;
                }
            }
            return 0;
        };

        const entryPatterns = [
            /entry\s*price[:\s*]+([\d,.]+)/i,
            /entry[:\s*]+([\d,.]+)/i,
            /giriş[:\s*]+([\d,.]+)/i,
        ];

        const tpPatterns = [
            /take\s*profit[:\s*]+([\d,.]+)/i,
            /tp[:\s*]+([\d,.]+)/i,
            /target[:\s*]+([\d,.]+)/i,
            /hedef[:\s*]+([\d,.]+)/i,
        ];

        const slPatterns = [
            /stop\s*loss[:\s*]+([\d,.]+)/i,
            /sl[:\s*]+([\d,.]+)/i,
            /zarar\s*durdur[:\s*]+([\d,.]+)/i,
        ];

        const entry = data.entry_price || data.entry || extractPrice(entryPatterns);
        const tp = data.tp_price || data.tp || data.take_profit || extractPrice(tpPatterns);
        const sl = data.sl_price || data.sl || data.stop_loss || extractPrice(slPatterns);

        // Clean up the analysis note - remove JSON wrapper
        let note = textContent;
        if (typeof note === 'object') {
            note = JSON.stringify(note);
        }
        // Clean up formatting artifacts
        note = note.replace(/\\n/g, '\n').replace(/\*\*/g, '').replace(/\n\n+/g, '\n\n');

        return {
            direction,
            entry_price: parseFloat(entry) || 0,
            tp_price: parseFloat(tp) || 0,
            sl_price: parseFloat(sl) || 0,
            analysis_note: note,
        };
    };

    const handleAnalyze = async () => {
        if (!image) {
            showWarning('Missing Chart', 'Please upload a chart image to start analysis.');
            haptic.error();
            return;
        }
        if (visibleAssets.length === 0) {
            showWarning('No Asset Selected', 'Please add a currency pair to analyze.');
            haptic.error();
            return;
        }

        setLoading(true);
        setIsSaved(false); // Reset save state for new analysis
        setParsedSignal(null);
        haptic.medium();

        try {
            // 1. Get AI Analysis (Updated to use FormData/File)
            const formData = new FormData();

            // Append Image as File
            formData.append('image', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'chart.jpg'
            } as any);

            // Append other fields
            formData.append('pair', selectedAsset);
            formData.append('timeframe', timeframe);
            formData.append('session', session);
            formData.append('userId', user?.id || 'guest');

            const response = await fetch('http://n8n-kkskgk8wss4scs8kkogcs4cg.91.99.182.76.sslip.io/webhook/4854c27c-9696-478b-b9ec-abbce0de50ca', {
                method: 'POST',
                // Header is not needed for FormData, fetch adds it automatically with boundary
                body: formData,
            });

            const data = await response.json();

            // Format the result for display
            setResult(JSON.stringify(data, null, 2));

            // Parse signal data
            const parsed = parseAIResponse(data);
            setParsedSignal(parsed);

            // Use the cleaned analysis note for display
            setResult(parsed.analysis_note);

            setModalVisible(true);
            haptic.success();

            // AUTO-SAVE: Trigger save immediately
            saveSignalToDB(parsed);

        } catch (error: any) {
            console.error(error);
            showWarning('Analysis Failed', error.message || 'Could not connect to AI service.');
            haptic.error();
        } finally {
            setLoading(false);
        }
    };

    // Save signal directly to PocketBase (Auto-Save)
    const saveSignalToDB = async (signalData: ParsedSignal) => {
        // Validate required data
        if (!signalData) {
            console.log('Auto-save skipped: No signal data');
            return;
        }
        if (!imageUri) {
            console.log('Auto-save skipped: No image URI');
            return;
        }
        if (!user?.id) {
            console.log('Auto-save skipped: No user ID');
            return;
        }

        setIsSaving(true);

        try {
            // === STRICT FORMDATA CONSTRUCTION ===
            // This mirrors user registration with avatar upload pattern

            // 1. Create FormData object (NOT a plain JS object)
            const formData = new FormData();

            // 2. Append Text Fields
            formData.append('pair', selectedAsset);
            formData.append('direction', signalData.direction);
            formData.append('timeframe', timeframe);
            formData.append('session', session); // Added session/timezone
            formData.append('status', 'PENDING');

            // 3. Append Number Fields as STRINGS (PocketBase accepts this)
            const entryPrice = parseFloat(String(signalData.entry_price)) || 0;
            const tpPrice = parseFloat(String(signalData.tp_price)) || 0;
            const slPrice = parseFloat(String(signalData.sl_price)) || 0;

            formData.append('entry_price', entryPrice.toString());
            formData.append('tp_price', tpPrice.toString());
            formData.append('sl_price', slPrice.toString());

            // 4. Append Analysis Note
            formData.append('analysis_note', signalData.analysis_note || '');

            // 5. Append User Relation (CRITICAL: Send ONLY the ID string)
            formData.append('user', user.id);

            // 6. Append started_at timestamp for time tracking
            formData.append('started_at', new Date().toISOString());

            // 6. Append the Image File (Strict Format)
            // User explicitly requested this specific structure
            formData.append('chart_image', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'upload.jpg'
            } as any);

            // 7. Log what we're sending for debugging
            console.log('Saving signal with data:', {
                pair: selectedAsset,
                direction: signalData.direction,
                timeframe: timeframe,
                entry_price: entryPrice,
                tp_price: tpPrice,
                sl_price: slPrice,
                user: user.id,
                imageUri: imageUri.substring(0, 50) + '...',
            });

            // 8. Send to PocketBase
            const record = await pb.collection('signals').create(formData);

            console.log('✓ Signal saved successfully! ID:', record.id);
            setIsSaved(true);
            haptic.success();

        } catch (error: any) {
            console.error('✗ Failed to save signal:', error);
            console.error('Error details:', JSON.stringify(error.data || error.message));
            setIsSaved(false);

            // Check for specific relation error
            const errData = error?.data?.data?.user;
            if (errData?.code === 'validation_missing_rel_records') {
                showWarning(
                    'Schema Error',
                    'PocketBase "signals" collection "user" field must point to "deneme" collection. Please update your backend schema.'
                );
            } else {
                // Show error to user since auto-save failed
                showWarning('Kayıt Hatası', `Sinyal kaydedilemedi: ${error.message || 'Bilinmeyen hata'}`);
            }
            haptic.error();
        } finally {
            setIsSaving(false);
        }
    };

    const SelectionGroup = ({ label, icon: Icon, children }: any) => (
        <View style={styles.group}>
            <View style={styles.groupHeader}>
                <Icon size={16} color={colors.primary} />
                <Text style={styles.groupLabel}>{label}</Text>
            </View>
            <View style={styles.groupContent}>
                {children}
            </View>
        </View>
    );

    const showWarning = (title: string, message: string) => {
        setWarningMessage({ title, message });
        setWarningVisible(true);
    };

    const handleLockedCurrencyPress = () => {
        // We do NOT use haptic.warning() here if it might fail, stick to try/catch or just use it.
        // Assuming haptics work.
        try { haptic.warning(); } catch (e) { }
        showWarning(
            "Restricted Asset",
            "Currently, only Gold (XAUUSD) is supported for AI analysis. We are working hard to bring other pairs soon."
        );
    };

    const addAsset = (code: string) => {
        if (!visibleAssets.includes(code)) {
            const newAssets = [...visibleAssets, code];
            setVisibleAssets(newAssets);
            setSelectedAsset(code);
            haptic.success();
            setSearchVisible(false);
        } else {
            setSelectedAsset(code);
            setSearchVisible(false);
            haptic.selection();
        }
    };

    const removeAsset = (code: string) => {
        haptic.medium();
        const newAssets = visibleAssets.filter(a => a !== code);
        setVisibleAssets(newAssets);
        if (selectedAsset === code && newAssets.length > 0) {
            setSelectedAsset(newAssets[0]);
        } else if (newAssets.length === 0) {
            setSelectedAsset('');
        }
    };

    // INTERNAL COMPONENT FOR WARNING OVERLAY
    const WarningOverlay = () => (
        <View style={StyleSheet.absoluteFill}>
            <View style={styles.warningOverlay}>
                <View style={styles.warningCard}>
                    {/* Removed large icon container for neatness */}
                    <View style={styles.warningIconSmall}>
                        <ShieldAlert color={colors.warning} size={32} />
                    </View>
                    <Text style={styles.warningTitle}>{warningMessage.title}</Text>
                    <Text style={styles.warningMessage}>{warningMessage.message}</Text>

                    <TouchableOpacity
                        style={styles.warningButton}
                        onPress={() => { haptic.light(); setWarningVisible(false); }}
                    >
                        <Text style={styles.warningButtonText}>Understood</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>AI Analysis</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Upload Section */}
                <TouchableOpacity style={styles.uploadCard} onPress={pickImage}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <View style={styles.iconCircle}>
                                <Upload color={colors.primary} size={24} />
                            </View>
                            <Text style={styles.uploadText}>Select Chart Image</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Options */}
                <View style={styles.optionsContainer}>

                    <SelectionGroup label="ASSET" icon={LayoutGrid}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollSelect}>

                            {visibleAssets.map((assetCode) => (
                                <TouchableOpacity
                                    key={assetCode}
                                    style={[styles.optionBtn, selectedAsset === assetCode && styles.optionBtnActive]}
                                    onPress={() => { setSelectedAsset(assetCode); haptic.selection(); }}
                                >
                                    <Text style={[styles.optionText, selectedAsset === assetCode && styles.optionTextActive]}>{assetCode}</Text>

                                    <TouchableOpacity
                                        style={styles.deleteBadge}
                                        onPress={() => removeAsset(assetCode)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <X size={12} color={selectedAsset === assetCode ? colors.text : colors.textSecondary} />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}

                            {/* ADD BUTTON */}
                            <TouchableOpacity
                                style={[styles.optionBtn, styles.addBtn]}
                                onPress={() => { haptic.selection(); setSearchVisible(true); }}
                            >
                                <Plus color={colors.textSecondary} size={20} />
                            </TouchableOpacity>

                        </ScrollView>
                    </SelectionGroup>

                    <SelectionGroup label="TIMEFRAME" icon={Clock}>
                        <View style={styles.rowSelect}>
                            {TIMEFRAMES.map(t => (
                                <TouchableOpacity
                                    key={t.value}
                                    style={[styles.optionBtn, styles.flexOption, timeframe === t.value && styles.optionBtnActive]}
                                    onPress={() => { setTimeframe(t.value); haptic.selection(); }}
                                >
                                    <Text style={[styles.optionText, timeframe === t.value && styles.optionTextActive]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </SelectionGroup>

                    <SelectionGroup label="SESSION" icon={Globe}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollSelect}>
                            {SESSIONS.map(s => (
                                <TouchableOpacity
                                    key={s}
                                    style={[styles.optionBtn, session === s && styles.optionBtnActive]}
                                    onPress={() => { setSession(s); haptic.selection(); }}
                                >
                                    <Text style={[styles.optionText, session === s && styles.optionTextActive]}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </SelectionGroup>

                </View>

                {/* Action Button */}
                <TouchableOpacity
                    style={[styles.actionButton, (loading || visibleAssets.length === 0) && styles.actionButtonDisabled]}
                    onPress={handleAnalyze}
                    disabled={loading || visibleAssets.length === 0}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.text} />
                    ) : (
                        <>
                            <Play color={colors.text} fill={colors.text} size={18} />
                            <Text style={styles.actionButtonText}>Analyze Market</Text>
                        </>
                    )}
                </TouchableOpacity>

            </ScrollView>

            {/* Analysis Result Modal */}
            <Modal
                visible={modalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Prediction</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeIcon}>
                                <X color={colors.textSecondary} size={20} />
                            </TouchableOpacity>
                        </View>

                        {/* Parsed Signal Summary */}
                        {parsedSignal && (
                            <View style={styles.signalSummary}>
                                <View style={[styles.directionBadge, parsedSignal.direction === 'BUY' ? styles.buyBadge : styles.sellBadge]}>
                                    <Text style={styles.directionText}>{parsedSignal.direction}</Text>
                                </View>
                                <View style={styles.priceRow}>
                                    <View style={styles.priceItem}>
                                        <Text style={styles.priceLabel}>Entry</Text>
                                        <Text style={styles.priceValue}>{parsedSignal.entry_price || '-'}</Text>
                                    </View>
                                    <View style={styles.priceItem}>
                                        <Text style={styles.priceLabel}>TP</Text>
                                        <Text style={[styles.priceValue, styles.tpColor]}>{parsedSignal.tp_price || '-'}</Text>
                                    </View>
                                    <View style={styles.priceItem}>
                                        <Text style={styles.priceLabel}>SL</Text>
                                        <Text style={[styles.priceValue, styles.slColor]}>{parsedSignal.sl_price || '-'}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        <ScrollView style={styles.resultBox}>
                            <Text style={styles.resultText}>{result}</Text>
                        </ScrollView>


                        {/* Saving Indicator & Close Button */}
                        <View style={{ marginTop: 20 }}>
                            {isSaving ? (
                                <View style={styles.savingContainer}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                    <Text style={styles.savingText}>Veritabanına kaydediliyor...</Text>
                                </View>
                            ) : isSaved ? (
                                <View style={styles.savedContainer}>
                                    <CheckCircle size={20} color={colors.success} />
                                    <Text style={styles.savedText}>Kaydedildi ve Takip Başladı</Text>
                                </View>
                            ) : null}

                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>KAPAT</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Currency Search Modal - CHANGED TO CUSTOM BOTTOM SHEET STYLE */}
            <Modal
                visible={searchVisible}
                animationType="none"
                transparent={true}
                onRequestClose={() => setSearchVisible(false)}
            >
                <View style={styles.bottomSheetOverlay}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setSearchVisible(false)}
                    />

                    <View style={styles.bottomSheetContent}>
                        <View style={styles.bottomSheetHeader}>
                            <View style={styles.dragHandle} />
                            <View style={styles.searchHeader}>
                                <Text style={styles.searchTitle}>Add Asset</Text>
                                <TouchableOpacity onPress={() => setSearchVisible(false)} style={styles.closeSearch}>
                                    <Text style={styles.doneText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.searchBar}>
                            <Search color={colors.textSecondary} size={20} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search currency..."
                                placeholderTextColor={colors.textMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        <ScrollView contentContainerStyle={styles.currencyList}>
                            {FOREX_PAIRS.filter(c =>
                                c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                c.name.toLowerCase().includes(searchQuery.toLowerCase())
                            ).map((currency) => (
                                <TouchableOpacity
                                    key={currency.code}
                                    style={styles.currencyItem}
                                    onPress={() => {
                                        if (currency.code === 'XAUUSD') {
                                            addAsset(currency.code);
                                        } else {
                                            handleLockedCurrencyPress();
                                        }
                                    }}
                                >
                                    <View style={styles.currencyInfo}>
                                        <Text style={styles.currencyCode}>{currency.code}</Text>
                                        <Text style={styles.currencyName}>{currency.name}</Text>
                                    </View>
                                    {currency.code === 'XAUUSD' ? (
                                        <View style={styles.activeBadge}>
                                            <Text style={styles.activeText}>Active</Text>
                                        </View>
                                    ) : (
                                        <Lock color={colors.textSecondary} size={18} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Warning Overlay INSIDE Search Modal */}
                        {warningVisible && <WarningOverlay />}
                    </View>
                </View>
            </Modal>

            {/* Warning Overlay INSIDE Main Screen (only if search is closed) */}
            {warningVisible && !searchVisible && <WarningOverlay />}

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingVertical: spacing.m,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        ...typography.h2,
        color: colors.text,
        letterSpacing: 0.5,
    },
    content: {
        padding: spacing.l,
    },
    uploadCard: {
        height: 200,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.l,
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        alignItems: 'center',
        gap: spacing.s,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadText: {
        ...typography.body,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover' as 'cover',
    } as ImageStyle,
    optionsContainer: {
        gap: spacing.l,
        marginBottom: spacing.xl,
    },
    group: {
        gap: spacing.s,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingLeft: 4,
    },
    groupLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    groupContent: {
        // Container for options
    },
    scrollSelect: {
        gap: spacing.s,
    },
    rowSelect: {
        flexDirection: 'row',
        gap: spacing.s,
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.m,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.m,
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 80,
        justifyContent: 'center',
        gap: 8,
    },
    deleteBadge: {
        padding: 2,
    },
    addBtn: {
        width: 50,
        minWidth: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
    },
    flexOption: {
        flex: 1,
    },
    optionBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    optionText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    optionTextActive: {
        color: colors.text,
        fontWeight: 'bold',
    },
    actionButton: {
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: borderRadius.l,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.s,
        shadowColor: colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButtonDisabled: {
        opacity: 0.4,
        backgroundColor: colors.surfaceHighlight,
    },
    actionButtonText: {
        ...typography.h2,
        fontSize: 16,
        color: colors.text,
    },
    // Modal Basic
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.l,
    },
    modalCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.l,
        width: '100%',
        maxHeight: '70%',
        padding: spacing.l,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    modalTitle: {
        ...typography.h2,
        color: colors.text,
    },
    closeIcon: {
        padding: 4,
    },
    resultBox: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.m,
        padding: spacing.m,
    },
    resultText: {
        color: colors.textSecondary,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 14,
    },

    // Bottom Sheet Style (Replaces Search Container)
    bottomSheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheetContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%', // Default drop down height
        paddingBottom: 20,
    },
    bottomSheetHeader: {
        alignItems: 'center',
        paddingTop: 8,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.borderLight,
        borderRadius: 2,
        marginBottom: 8,
    },
    searchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: spacing.m,
        paddingBottom: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    searchTitle: {
        ...typography.h2,
        color: colors.text,
    },
    closeSearch: {
        padding: 4,
    },
    doneText: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    searchBar: {
        margin: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background, // Contrast against surface
        borderRadius: borderRadius.m,
        paddingHorizontal: spacing.m,
        height: 50,
        gap: spacing.s,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchInput: {
        flex: 1,
        color: colors.text,
        fontSize: 16,
        height: '100%',
    },
    currencyList: {
        padding: spacing.m,
    },
    currencyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceHighlight,
    },
    currencyInfo: {
        flex: 1,
    },
    currencyCode: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 2,
    },
    currencyName: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    activeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(0, 245, 160, 0.1)',
        borderRadius: 4,
    },
    activeText: {
        fontSize: 12,
        color: colors.success,
        fontWeight: 'bold',
    },

    // WARNING STYLES REFINED
    warningOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        zIndex: 9999,
    },
    warningCard: {
        backgroundColor: '#151515', // Sleek dark grey
        borderRadius: borderRadius.l, // slightly less rounded
        padding: spacing.xl,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderLight, // Clean subtle border
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    warningIconSmall: {
        marginBottom: spacing.m,
    },
    warningTitle: {
        ...typography.h2,
        fontSize: 20,
        color: colors.text,
        marginBottom: spacing.s, // Tighter spacing
        textAlign: 'center',
    },
    warningMessage: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.l, // Reduced bottom margin
    },
    warningButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12, // slightly reduced padding
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.m,
        width: '100%',
        alignItems: 'center',
    },
    warningButtonText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },

    // SIGNAL SUMMARY STYLES
    signalSummary: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.m,
        padding: spacing.m,
        marginBottom: spacing.m,
    },
    directionBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.s,
        marginBottom: spacing.s,
    },
    buyBadge: {
        backgroundColor: 'rgba(0, 200, 100, 0.2)',
    },
    sellBadge: {
        backgroundColor: 'rgba(255, 80, 80, 0.2)',
    },
    directionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    priceItem: {
        alignItems: 'center',
        flex: 1,
    },
    priceLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    priceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
    tpColor: {
        color: colors.success,
    },
    slColor: {
        color: colors.error || '#FF5252',
    },

    // SAVE BUTTON STYLES
    saveButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.m,
        borderRadius: borderRadius.m,
        marginTop: spacing.m,
        gap: spacing.s,
    },
    saveButtonSaved: {
        backgroundColor: colors.success,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },

    // NEW AUTO-SAVE UI STYLES
    savingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.m,
        gap: spacing.s,
    },
    savingText: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    savedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.m,
        gap: spacing.s,
    },
    savedText: {
        color: colors.success,
        fontSize: 14,
        fontWeight: 'bold',
    },
    closeButton: {
        backgroundColor: colors.surfaceHighlight,
        paddingVertical: 14,
        borderRadius: borderRadius.m,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    closeButtonText: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '600',
    },
});

export default AnalysisScreen;
