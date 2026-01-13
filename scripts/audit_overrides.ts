/**
 * Audit Enhancement Overrides
 * ----------------------------------------------------------------------------
 * This script compares `enhancement` and `enhancement_override` blocks in
 * enhanced JSON files to find discrepancies where the override may have
 * dropped important data (costs, modifiers, etc.) that the parser correctly
 * identified.
 * 
 * Usage: npx ts-node scripts/audit_overrides.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface CardCosts {
    stress?: number;
    hope?: number;
    hit_points?: number;
}

interface CardModifier {
    stat: string;
    value: number;
    condition?: {
        type: string;
        domain?: string;
        minCount?: number;
    };
    formula?: string;
    source: string;
}

interface TokenBlock {
    has_tokens?: boolean;
    max_tokens?: number | null;
    token_source?: string;
}

interface EnhancementBlock {
    action_type?: string;
    timing?: string;
    frequency?: string;
    costs?: CardCosts;
    keywords?: string[];
    tokens?: TokenBlock;
    attack?: Record<string, unknown>;
    roll?: Record<string, unknown>;
    modifiers?: CardModifier[];
    duration?: string;
}

interface EnhancedItem {
    name: string;
    text?: string;
    enhancement?: EnhancementBlock;
    enhancement_override?: EnhancementBlock;
    // For nested structures (classes, subclasses)
    features?: EnhancedItem[];
    class_features?: EnhancedItem[];
    abilities?: EnhancedItem[];
}

interface Discrepancy {
    file: string;
    itemName: string;
    field: string;
    enhancementValue: unknown;
    overrideValue: unknown;
    severity: 'high' | 'medium' | 'low';
    reason: string;
}

const JSON_DIR = path.join(__dirname, '../content/public/srd/json');

const FILES_TO_AUDIT = [
    'abilities_enhanced.json',
    'ancestries_enhanced.json',
    'classes_enhanced.json',
    'communities_enhanced.json',
    'subclasses_enhanced.json',
];

function compareBlocks(
    fileName: string,
    itemName: string,
    enhancement: EnhancementBlock | undefined,
    override: EnhancementBlock | undefined
): Discrepancy[] {
    const discrepancies: Discrepancy[] = [];

    if (!enhancement || !override) {
        return discrepancies;
    }

    // Check costs - HIGH SEVERITY if override removes costs that parser found
    if (enhancement.costs && override.costs) {
        // Check for dropped Hope cost
        if (enhancement.costs.hope && !override.costs.hope) {
            discrepancies.push({
                file: fileName,
                itemName,
                field: 'costs.hope',
                enhancementValue: enhancement.costs.hope,
                overrideValue: override.costs.hope,
                severity: 'high',
                reason: 'Override removed Hope cost that parser identified'
            });
        }
        // Check for dropped Stress cost
        if (enhancement.costs.stress && !override.costs.stress) {
            discrepancies.push({
                file: fileName,
                itemName,
                field: 'costs.stress',
                enhancementValue: enhancement.costs.stress,
                overrideValue: override.costs.stress,
                severity: 'high',
                reason: 'Override removed Stress cost that parser identified'
            });
        }
        // Check for dropped Hit Point cost
        if (enhancement.costs.hit_points && !override.costs.hit_points) {
            discrepancies.push({
                file: fileName,
                itemName,
                field: 'costs.hit_points',
                enhancementValue: enhancement.costs.hit_points,
                overrideValue: override.costs.hit_points,
                severity: 'high',
                reason: 'Override removed Hit Point cost that parser identified'
            });
        }
    } else if (enhancement.costs && !override.costs) {
        discrepancies.push({
            file: fileName,
            itemName,
            field: 'costs',
            enhancementValue: enhancement.costs,
            overrideValue: undefined,
            severity: 'high',
            reason: 'Override completely removed costs block'
        });
    }

    // Check modifiers - HIGH SEVERITY if override removes or changes modifiers
    const enhancementModifiers = enhancement.modifiers || [];
    const overrideModifiers = override.modifiers || [];

    if (enhancementModifiers.length > 0 && overrideModifiers.length === 0) {
        discrepancies.push({
            file: fileName,
            itemName,
            field: 'modifiers',
            enhancementValue: enhancementModifiers.length,
            overrideValue: 0,
            severity: 'high',
            reason: 'Override removed all modifiers'
        });
    } else if (enhancementModifiers.length > overrideModifiers.length) {
        discrepancies.push({
            file: fileName,
            itemName,
            field: 'modifiers.length',
            enhancementValue: enhancementModifiers.length,
            overrideValue: overrideModifiers.length,
            severity: 'medium',
            reason: 'Override has fewer modifiers than parser found'
        });
    }

    // Check tokens - MEDIUM SEVERITY
    if (enhancement.tokens?.has_tokens && !override.tokens?.has_tokens) {
        discrepancies.push({
            file: fileName,
            itemName,
            field: 'tokens.has_tokens',
            enhancementValue: true,
            overrideValue: override.tokens?.has_tokens,
            severity: 'medium',
            reason: 'Override removed token mechanics'
        });
    }

    // Check attack - MEDIUM SEVERITY if removed
    if (enhancement.attack && !override.attack) {
        discrepancies.push({
            file: fileName,
            itemName,
            field: 'attack',
            enhancementValue: 'present',
            overrideValue: undefined,
            severity: 'medium',
            reason: 'Override removed attack block'
        });
    }

    // Check roll - LOW SEVERITY if removed (might be intentional)
    if (enhancement.roll && !override.roll) {
        discrepancies.push({
            file: fileName,
            itemName,
            field: 'roll',
            enhancementValue: 'present',
            overrideValue: undefined,
            severity: 'low',
            reason: 'Override removed roll block'
        });
    }

    // Check keywords - LOW SEVERITY (often intentionally corrected)
    const enhKeywords = enhancement.keywords || [];
    const overKeywords = override.keywords || [];
    const missingKeywords = enhKeywords.filter(k => !overKeywords.includes(k));
    if (missingKeywords.length > 0) {
        discrepancies.push({
            file: fileName,
            itemName,
            field: 'keywords',
            enhancementValue: missingKeywords,
            overrideValue: 'missing',
            severity: 'low',
            reason: `Override removed keywords: ${missingKeywords.join(', ')}`
        });
    }

    return discrepancies;
}

function auditItem(fileName: string, item: EnhancedItem, parentName?: string): Discrepancy[] {
    const discrepancies: Discrepancy[] = [];
    const fullName = parentName ? `${parentName} > ${item.name}` : item.name;

    // Check if item has both enhancement and override
    if (item.enhancement && item.enhancement_override) {
        discrepancies.push(...compareBlocks(fileName, fullName, item.enhancement, item.enhancement_override));
    }

    // Recursively check nested structures
    if (item.features) {
        for (const feature of item.features) {
            discrepancies.push(...auditItem(fileName, feature, fullName));
        }
    }
    if (item.class_features) {
        for (const feature of item.class_features) {
            discrepancies.push(...auditItem(fileName, feature, fullName));
        }
    }
    if (item.abilities) {
        for (const ability of item.abilities) {
            discrepancies.push(...auditItem(fileName, ability, fullName));
        }
    }

    return discrepancies;
}

function auditFile(fileName: string): Discrepancy[] {
    const filePath = path.join(JSON_DIR, fileName);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${fileName}`);
        return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    const discrepancies: Discrepancy[] = [];

    // Handle array of items (abilities, ancestries, communities)
    if (Array.isArray(data)) {
        for (const item of data) {
            discrepancies.push(...auditItem(fileName, item));
        }
    }
    // Handle object with nested arrays (classes, subclasses)
    else if (typeof data === 'object') {
        for (const key of Object.keys(data)) {
            const items = data[key];
            if (Array.isArray(items)) {
                for (const item of items) {
                    discrepancies.push(...auditItem(fileName, item, key));
                }
            }
        }
    }

    return discrepancies;
}

function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ENHANCEMENT OVERRIDE AUDIT');
    console.log('  Comparing parser results vs manual overrides');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const allDiscrepancies: Discrepancy[] = [];

    for (const file of FILES_TO_AUDIT) {
        console.log(`📄 Auditing ${file}...`);
        const discrepancies = auditFile(file);
        allDiscrepancies.push(...discrepancies);
        console.log(`   Found ${discrepancies.length} discrepancies\n`);
    }

    if (allDiscrepancies.length === 0) {
        console.log('✅ No discrepancies found! All overrides are consistent with parser results.');
        return;
    }

    // Group by severity
    const highSeverity = allDiscrepancies.filter(d => d.severity === 'high');
    const mediumSeverity = allDiscrepancies.filter(d => d.severity === 'medium');
    const lowSeverity = allDiscrepancies.filter(d => d.severity === 'low');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  RESULTS SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log(`🔴 HIGH severity:   ${highSeverity.length}`);
    console.log(`🟡 MEDIUM severity: ${mediumSeverity.length}`);
    console.log(`🔵 LOW severity:    ${lowSeverity.length}`);
    console.log(`   TOTAL:           ${allDiscrepancies.length}\n`);

    // Print HIGH severity details
    if (highSeverity.length > 0) {
        console.log('───────────────────────────────────────────────────────────────');
        console.log('🔴 HIGH SEVERITY DISCREPANCIES (likely bugs)');
        console.log('───────────────────────────────────────────────────────────────\n');

        for (const d of highSeverity) {
            console.log(`  📍 ${d.file}`);
            console.log(`     Item: ${d.itemName}`);
            console.log(`     Field: ${d.field}`);
            console.log(`     Parser found: ${JSON.stringify(d.enhancementValue)}`);
            console.log(`     Override has: ${JSON.stringify(d.overrideValue)}`);
            console.log(`     Issue: ${d.reason}`);
            console.log('');
        }
    }

    // Print MEDIUM severity details
    if (mediumSeverity.length > 0) {
        console.log('───────────────────────────────────────────────────────────────');
        console.log('🟡 MEDIUM SEVERITY DISCREPANCIES (review recommended)');
        console.log('───────────────────────────────────────────────────────────────\n');

        for (const d of mediumSeverity) {
            console.log(`  📍 ${d.file}`);
            console.log(`     Item: ${d.itemName}`);
            console.log(`     Field: ${d.field}`);
            console.log(`     Parser found: ${JSON.stringify(d.enhancementValue)}`);
            console.log(`     Override has: ${JSON.stringify(d.overrideValue)}`);
            console.log(`     Issue: ${d.reason}`);
            console.log('');
        }
    }

    // Print LOW severity summary (not full details)
    if (lowSeverity.length > 0) {
        console.log('───────────────────────────────────────────────────────────────');
        console.log('🔵 LOW SEVERITY DISCREPANCIES (informational)');
        console.log('───────────────────────────────────────────────────────────────\n');

        for (const d of lowSeverity) {
            console.log(`  • ${d.itemName}: ${d.reason}`);
        }
        console.log('');
    }
}

main();
