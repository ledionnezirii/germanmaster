import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, StyleSheet, Dimensions, Animated,
  Platform, UIManager, Modal, Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import pathService from "./pathService";
import api, { generateDicebearUrl } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { F } from "../../styles/fonts";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get("window");
const LEVEL_KEY        = "@gm_path_level";
const LEVEL_LOCKED_KEY = "@gm_path_level_locked";
const TOTAL_EX         = 6;
const COLS       = 3;
const NODE_SIZE  = 72;
const SNAKE_W    = width - 32;
const COL_W      = SNAKE_W / COLS;


const LEVELS = [
  { code: "A1", name: "Fillestar",       icon: "leaf-outline",    color: "#10b981", grad: ["#6ee7b7","#10b981"], desc: "Fjalë bazë dhe hyrje" },
  { code: "A2", name: "Bazë",            icon: "water-outline",   color: "#0ea5e9", grad: ["#7dd3fc","#0ea5e9"], desc: "Rutinë e përditshme" },
  { code: "B1", name: "Mesatar",         icon: "flash-outline",   color: "#8b5cf6", grad: ["#c4b5fd","#8b5cf6"], desc: "Tema të njohura" },
  { code: "B2", name: "Mesatar i Lartë", icon: "flame-outline",   color: "#f97316", grad: ["#fdba74","#f97316"], desc: "Diskutime komplekse" },
  { code: "C1", name: "Avancuar",        icon: "diamond-outline", color: "#f59e0b", grad: ["#fcd34d","#f59e0b"], desc: "Gjuhë profesionale" },
  { code: "C2", name: "Zotërim",         icon: "trophy-outline",  color: "#ef4444", grad: ["#fca5a5","#ef4444"], desc: "Zotërim i plotë" },
];

const SECTION_PALETTES = [
  { color: "#10b981", grad: ["#34d399", "#059669"] },
  { color: "#6366f1", grad: ["#818cf8", "#4f46e5"] },
  { color: "#f97316", grad: ["#fb923c", "#ea580c"] },
  { color: "#0ea5e9", grad: ["#38bdf8", "#0284c7"] },
  { color: "#f43f5e", grad: ["#fb7185", "#e11d48"] },
  { color: "#8b5cf6", grad: ["#a78bfa", "#7c3aed"] },
  { color: "#f59e0b", grad: ["#fbbf24", "#d97706"] },
  { color: "#14b8a6", grad: ["#2dd4bf", "#0f766e"] },
];

// ── Section Banner ─────────────────────────────────────────────────────────────
function SectionBanner({ title, num, color, grad, doneCount, total, sectionIcon, sectionIconFamily, users = [] }) {
  const pct     = total > 0 ? doneCount / total : 0;
  const visible = users.slice(0, 5);
  const extra   = users.length > 5 ? users.length - 5 : 0;

  return (
    <View style={sb.wrap}>
      <LinearGradient colors={grad} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={sb.banner}>
        {/* Top row: icon + title + progress */}
        <View style={sb.topRow}>
          <View style={sb.iconBox}>
            {sectionIconFamily === "Ionicons" && sectionIcon
              ? <Ionicons name={sectionIcon} size={22} color="#fff" />
              : sectionIcon
              ? <Text style={sb.iconEmoji}>{sectionIcon}</Text>
              : <Ionicons name="layers-outline" size={22} color="#fff" />
            }
          </View>
          <View style={sb.left}>
            <Text style={sb.label}>SEKSIONI {num}</Text>
            <Text style={sb.title} numberOfLines={1}>{title}</Text>
          </View>
          <View style={sb.right}>
            <Text style={sb.pct}>{doneCount}/{total}</Text>
            <View style={sb.barTrack}>
              <View style={[sb.barFill, { width: `${Math.round(pct * 100)}%` }]} />
            </View>
          </View>
        </View>

        {/* Users in this section */}
        {users.length > 0 && (
          <View style={sb.usersRow}>
            <View style={sb.avatarStack}>
              {visible.map((u, i) => {
                const url = generateDicebearUrl(u._id, u.avatarStyle);
                return (
                  <View key={u._id} style={[sb.avatarWrap, { marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i }]}>
                    {url ? (
                      <Image source={{ uri: url }} style={sb.avatar} />
                    ) : (
                      <View style={[sb.avatar, sb.avatarFallback]}>
                        <Text style={sb.avatarInitial}>{(u.emri || "?")[0].toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
              {extra > 0 && (
                <View style={[sb.avatarWrap, sb.avatarExtra, { marginLeft: -10 }]}>
                  <Text style={sb.extraTxt}>+{extra}</Text>
                </View>
              )}
            </View>
            <Text style={sb.usersTxt}>
              {users.length === 1
                ? "1 nxënës në këtë seksion"
                : `${users.length} nxënës në këtë seksion`}
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

// ── Progress Ring (SVG arc segments) ─────────────────────────────────────────
const RING_SIZE = NODE_SIZE + 32;

function arcPath(cx, cy, r, startDeg, endDeg) {
  const toRad = (d) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function ProgressRing({ completed, total = 6 }) {
  const cx     = RING_SIZE / 2;
  const cy     = RING_SIZE / 2;
  const r      = RING_SIZE / 2 - 9;
  const gap    = 9;
  const segDeg = 360 / total;
  const SW     = 8; // stroke width

  return (
    <Svg width={RING_SIZE} height={RING_SIZE + 7} style={{ position: "absolute", top: 0, left: 0 }} pointerEvents="none">
      {Array.from({ length: total }).map((_, i) => {
        const startDeg = i * segDeg - 90 + gap / 2;
        const endDeg   = startDeg + segDeg - gap;
        const done     = i < completed;
        const topColor    = done ? "#f97316" : "#e2e8f0";
        const shadowColor = done ? "#c2410c" : "#b0b8c4";
        const d = arcPath(cx, cy, r, startDeg, endDeg);
        return (
          <React.Fragment key={i}>
            {/* Shadow arc matches the circle's 3D depth offset exactly */}
            <Path
              d={arcPath(cx, cy + 7, r, startDeg, endDeg)}
              stroke={shadowColor}
              strokeWidth={SW}
              strokeLinecap="round"
              fill="none"
              opacity={0.7}
            />
            {/* Main arc */}
            <Path
              d={d}
              stroke={topColor}
              strokeWidth={SW}
              strokeLinecap="round"
              fill="none"
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ── Box type config ────────────────────────────────────────────────────────────
const BOX_TYPE_CONFIG = {
  lesson:   { activeGrad: ["#4ade80","#22c55e"], activeShadow: "#15803d", inactiveGrad: ["#c4b5fd","#a78bfa"], inactiveShadow: "#7c3aed", activeIcon: "star",            inactiveIcon: "ellipse-outline",    ctaColor: "#22c55e", ctaShadow: "#22c55e" },
  mistakes: { activeGrad: ["#fbbf24","#f59e0b"], activeShadow: "#b45309", inactiveGrad: ["#fde68a","#fbbf24"], inactiveShadow: "#92400e", activeIcon: "refresh-circle",   inactiveIcon: "refresh-outline",    ctaColor: "#f59e0b", ctaShadow: "#f59e0b" },
  favorite: { activeGrad: ["#fb7185","#f43f5e"], activeShadow: "#be123c", inactiveGrad: ["#fda4af","#fb7185"], inactiveShadow: "#9f1239", activeIcon: "heart",            inactiveIcon: "heart-outline",      ctaColor: "#f43f5e", ctaShadow: "#f43f5e" },
  practice: { activeGrad: ["#60a5fa","#3b82f6"], activeShadow: "#1d4ed8", inactiveGrad: ["#bfdbfe","#60a5fa"], inactiveShadow: "#1e40af", activeIcon: "school-outline",   inactiveIcon: "school-outline",     ctaColor: "#3b82f6", ctaShadow: "#3b82f6" },
};

// ── Snake Node ─────────────────────────────────────────────────────────────────
function SnakeNode({ topic, globalIdx, isUnlocked, isActive, levelColor, onPress }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const progress  = topic.userProgress;
  const done      = progress?.isCompleted ?? false;
  const completed = progress?.completedCount ?? 0;
  const isLocked  = !isUnlocked;
  const cfg       = BOX_TYPE_CONFIG[topic.boxType] || BOX_TYPE_CONFIG.lesson;

  const mainColor  = done ? "#f97316" : isActive ? cfg.ctaColor : isLocked ? "#94a3b8" : cfg.ctaColor;
  const grad       = done
    ? ["#fb923c", "#f97316"]
    : isLocked
    ? ["#cbd5e1", "#94a3b8"]
    : isActive
    ? cfg.activeGrad
    : cfg.inactiveGrad;
  const shadowColor = done ? "#c2410c" : isLocked ? "#475569" : isActive ? cfg.activeShadow : cfg.inactiveShadow;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }).start();
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isActive]);

  const btnLabel = completed === 0 ? "FILLO" : "VAZHDO";

  return (
    <Animated.View style={[sn.nodeWrap, { transform: [{ scale: scaleAnim }] }]}>

      <View style={sn.ringWrap}>
        <TouchableOpacity
          onPress={() => onPress(topic)}
          activeOpacity={0.82}
          style={sn.nodeInner}
        >
          {/* 3D bottom shadow layer */}
          <View style={[sn.circle, sn.circle3d, { backgroundColor: shadowColor }]} />
          {/* Main circle */}
          <LinearGradient
            colors={grad}
            style={[sn.circle, sn.circleTop, isActive && sn.circleActive]}
          >
            {done     && <Ionicons name="checkmark-circle"    size={34} color="#fff" />}
            {isLocked && <Ionicons name="lock-closed"         size={28} color="#fff" />}
            {!done && !isLocked && isActive  && <Ionicons name={cfg.activeIcon}   size={30} color="#fff" />}
            {!done && !isLocked && !isActive && <Ionicons name={cfg.inactiveIcon} size={26} color="rgba(255,255,255,0.85)" />}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Number badge — sits top-right of the ring */}
      <View style={[sn.numBadge, { backgroundColor: mainColor }]}>
        <Text style={sn.numTxt}>{globalIdx + 1}</Text>
      </View>

      {/* Title */}
      <Text style={[sn.label, isLocked && sn.labelLocked]} numberOfLines={2}>
        {topic.title}
      </Text>

      {/* CTA button for active node */}
      {isActive && (
        <TouchableOpacity
          style={[sn.ctaBtn, { backgroundColor: cfg.ctaColor, shadowColor: cfg.ctaShadow }]}
          onPress={() => onPress(topic)}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={12} color="#fff" />
          <Text style={sn.ctaTxt}>{btnLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ── Section Test Node (Castle) ────────────────────────────────────────────────
function SectionTestNode({ sectionNum, sectionTitle, passed, unlocked, attempted, onPress }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(1)).current;

  // failed = attempted once but didn't pass → cannot retry
  const failed    = attempted && !passed;
  const canPress  = unlocked && !passed && !failed;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }).start();
    if (canPress) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 1,   duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [canPress]);

  const grad = passed
    ? ["#34d399", "#10b981"]
    : failed
    ? ["#fca5a5", "#ef4444"]
    : canPress
    ? ["#6ee7b7", "#34d399"]
    : ["#e2e8f0", "#cbd5e1"];

  const shadowColor = passed ? "#065f46" : failed ? "#b91c1c" : canPress ? "#047857" : "#94a3b8";

  const trophyIcon  = failed ? "close-circle" : "trophy";
  const labelText   = passed
    ? "✓ TEST I KALUAR"
    : failed
    ? "✗ TENTATIVË E SHTERUAR"
    : "TEST FINAL";
  const labelColor  = passed ? "#059669" : failed ? "#dc2626" : canPress ? "#059669" : "#94a3b8";
  const labelBorder = passed ? "#34d399" : failed ? "#fca5a5" : canPress ? "#6ee7b7" : "#e2e8f0";
  const labelBg     = passed ? "#f0fdf4" : failed ? "#fff1f2" : "#fff";

  return (
    <Animated.View style={[stn.wrap, { transform: [{ scale: scaleAnim }] }]}>
      {canPress && (
        <Animated.View style={[stn.glowRing, { transform: [{ scale: glowAnim }] }]} />
      )}

      <TouchableOpacity
        onPress={() => canPress && onPress()}
        disabled={!canPress}
        activeOpacity={canPress ? 0.82 : 1}
        style={stn.touchable}
      >
        <View style={[stn.castleBox, stn.castleShadow, { backgroundColor: shadowColor }]} />
        <LinearGradient colors={grad} style={[stn.castleBox, stn.castleTop]}>
          <Ionicons name={trophyIcon} size={42} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <View style={[stn.labelWrap, { borderColor: labelBorder, backgroundColor: labelBg }]}>
        <Text style={[stn.labelTxt, { color: labelColor }]}>{labelText}</Text>
      </View>
    </Animated.View>
  );
}

// ── Horizontal Connector (dashes between adjacent nodes) ──────────────────────
function HConnector({ color }) {
  return (
    <View style={hc.wrap} pointerEvents="none">
      {[0,1,2,3,4].map(i => (
        <View key={i} style={[hc.dash, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

// ── Turn Connector (bend at end of row) ────────────────────────────────────────
function TurnConnector({ side, color }) {
  const isRight = side === "right";
  return (
    <View style={[tc2.wrap, isRight ? tc2.wrapRight : tc2.wrapLeft]} pointerEvents="none">
      <View style={[tc2.arm, tc2.armH, { backgroundColor: color, alignSelf: isRight ? "flex-end" : "flex-start" }]} />
      <View style={[tc2.arm, tc2.armV, { backgroundColor: color, alignSelf: isRight ? "flex-end" : "flex-start" }]} />
    </View>
  );
}

// ── Snake Row ──────────────────────────────────────────────────────────────────
function SnakeRow({ chunk, startIdx, rowIdx, activeIdx, levelColor, levelGrad, onPress }) {
  const isReversed = rowIdx % 2 === 1;
  const positions = isReversed ? [...chunk].reverse() : chunk;

  return (
    <View style={sr.row}>
      {positions.map((topic, colIdx) => {
        if (!topic) return <View key={`empty-${colIdx}`} style={{ width: COL_W }} />;

        const realIdxInChunk = isReversed ? (chunk.length - 1 - colIdx) : colIdx;
        const globalIdx = startIdx + realIdxInChunk;

        return (
          <View key={topic._id} style={[sr.cell, { width: COL_W }]}>
            {colIdx < positions.length - 1 && positions[colIdx + 1] && (
              <HConnector color={levelColor + "66"} />
            )}
            <SnakeNode
              topic={topic}
              globalIdx={globalIdx}
              isUnlocked={topic._unlocked}
              isActive={globalIdx === activeIdx}
              levelColor={levelColor}
              onPress={onPress}
            />
          </View>
        );
      })}
    </View>
  );
}

// ── Snake Path ─────────────────────────────────────────────────────────────────
function SnakePath({ sections, sectionTests, activeIdx, levelColor, levelGrad, onPress, onSectionTest, sectionUsersMap, onSectionLayout }) {
  const rendered = [];
  let rowIdx = 0;

  sections.forEach((sectionData, secIdx) => {
    const secTopics  = sectionData.topics;
    const doneCount  = secTopics.filter(t => t.userProgress?.isCompleted).length;
    const palette    = SECTION_PALETTES[secIdx % SECTION_PALETTES.length];

    rendered.push(
      <View
        key={`bannerWrap-${sectionData.num}`}
        onLayout={(e) => onSectionLayout?.(sectionData.num, e.nativeEvent.layout.y)}
      >
        <SectionBanner
          num={sectionData.num}
          title={sectionData.title}
          color={palette.color}
          grad={palette.grad}
          doneCount={doneCount}
          total={secTopics.length}
          sectionIcon={sectionData.sectionIcon}
          sectionIconFamily={sectionData.sectionIconFamily}
          users={sectionUsersMap?.[sectionData.num] ?? []}
        />
      </View>
    );

    // Chunk this section's topics independently
    const chunks = [];
    for (let i = 0; i < secTopics.length; i += COLS) {
      chunks.push(secTopics.slice(i, i + COLS));
    }

    chunks.forEach((chunk, chunkIdx) => {
      const startGlobalIdx = chunk[0].globalIdx;
      const paddedChunk    = [...chunk];
      while (paddedChunk.length < COLS) paddedChunk.push(null);

      rendered.push(
        <SnakeRow
          key={`row-${sectionData.num}-${chunkIdx}`}
          chunk={paddedChunk}
          startIdx={startGlobalIdx}
          rowIdx={rowIdx}
          activeIdx={activeIdx}
          levelColor={palette.color}
          levelGrad={palette.grad}
          onPress={onPress}
        />
      );

      const isLastChunk = chunkIdx === chunks.length - 1;
      if (isLastChunk) {
        const stData  = (sectionTests || []).find(st => st.sectionNum === sectionData.num);
        const allDone = secTopics.every(t => t.userProgress?.isCompleted);
        rendered.push(
          <View key={`st-row-${sectionData.num}`} style={stn.rowWrap}>
            <SectionTestNode
              sectionNum={sectionData.num}
              sectionTitle={sectionData.title}
              passed={stData?.passed ?? false}
              attempted={stData?.attempted ?? false}
              unlocked={allDone}
              onPress={() => onSectionTest(sectionData.num, sectionData.title)}
            />
          </View>
        );
      } else {
        const turnSide = rowIdx % 2 === 0 ? "right" : "left";
        rendered.push(
          <TurnConnector key={`turn-${sectionData.num}-${chunkIdx}`} side={turnSide} color={palette.color + "55"} />
        );
      }

      rowIdx++;
    });
  });

  return <View style={sp.container}>{rendered}</View>;
}

// ── Topic Preview Sheet ────────────────────────────────────────────────────────
function TopicPreviewSheet({ topic, levelColor, levelGrad, onStart, onClose, isLocked }) {
  const slideAnim    = useRef(new Animated.Value(320)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim,    { toValue: 0, useNativeDriver: true, tension: 70, friction: 14 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.45, duration: 600, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const close = () => {
    Animated.parallel([
      Animated.timing(slideAnim,    { toValue: 320, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  if (!topic) return null;

  const progress   = topic.userProgress;
  const completed  = progress?.completedCount ?? 0;
  const done       = progress?.isCompleted ?? false;
  const curExIdx   = progress?.currentExerciseIndex ?? 0;
  const total      = progress?.totalExercises || topic.exercises?.length || 1;
  const btnLabel   = done ? "Rishiko" : completed === 0 ? "Fillo" : "Vazhdo";

  const color = topic.color || levelColor;

  return (
    <Modal transparent animationType="none" onRequestClose={close}>
      {/* Backdrop */}
      <Animated.View style={[ps.backdrop, { opacity: backdropAnim }]} pointerEvents="box-none">
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={close} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[ps.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={ps.handle} />

        {/* Close btn */}
        <TouchableOpacity style={ps.closeBtn} onPress={close} activeOpacity={0.8}>
          <Ionicons name="close" size={18} color="#64748b" />
        </TouchableOpacity>

        {/* Icon + Title */}
        <View style={ps.topRow}>
          <LinearGradient colors={levelGrad} style={[ps.iconCircle, { shadowColor: color }]}>
            {topic.iconFamily === "Ionicons"
              ? <Ionicons name={topic.icon || "book-outline"} size={32} color="#fff" />
              : <Text style={ps.iconEmoji}>{topic.icon || "📚"}</Text>
            }
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={ps.title} numberOfLines={2}>{topic.title}</Text>
            {topic.description ? (
              <Text style={ps.desc} numberOfLines={2}>{topic.description}</Text>
            ) : null}
          </View>
        </View>

        {/* Progress segments */}
        <View style={ps.segRow}>
          {Array.from({ length: total }).map((_, i) => {
            const isCurrent = i === completed && !done;
            let bg;
            if (i < completed)  bg = "#f97316";
            else if (isCurrent) bg = "#eab308";
            else                bg = "#e2e8f0";
            if (isCurrent) {
              return (
                <Animated.View
                  key={i}
                  style={[ps.seg, ps.segCurrent, { backgroundColor: bg, opacity: pulseAnim }]}
                />
              );
            }
            return <View key={i} style={[ps.seg, { backgroundColor: bg }]} />;
          })}
          <Text style={ps.segLabel}>{completed}/{TOTAL_EX}</Text>
        </View>

        {/* Start / Locked button */}
        {isLocked ? (
          <View style={ps.lockedBtn}>
            <Ionicons name="lock-closed" size={20} color="#94a3b8" />
            <Text style={ps.lockedTxt}>Bllokuar · Përfundo temën e mëparshme</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[ps.startBtn, { backgroundColor: color }]}
            onPress={() => { close(); setTimeout(() => onStart(topic, done ? 0 : curExIdx), 260); }}
            activeOpacity={0.88}
          >
            <Ionicons name={completed === 0 ? "play" : "arrow-forward"} size={18} color="#fff" />
            <Text style={ps.startTxt}>{btnLabel}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Modal>
  );
}

// ── Level Picker ──────────────────────────────────────────────────────────────
const SHEET_HEIGHT = height * 0.72;

function LevelPicker({ visible, current, onSelect, onClose }) {
  const slideAnim   = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim,    { toValue: 0, useNativeDriver: true, tension: 65, friction: 13 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim,    { toValue: SHEET_HEIGHT, duration: 260, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0,            duration: 240, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[lp.backdrop, { opacity: backdropAnim }]} pointerEvents="box-none">
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View style={[lp.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={lp.handle} />
        <View style={lp.sheetHeader}>
          <View style={lp.iconBox}>
            <Ionicons name="map" size={22} color="#8b5cf6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={lp.title}>Zgjidhni Nivelin</Text>
            <Text style={lp.sub}>Ku je me gjuhën tani?</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={lp.closeBtn}>
            <Ionicons name="close" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={lp.grid}>
            {LEVELS.map((lvl) => {
              const active = lvl.code === current;
              return (
                <TouchableOpacity key={lvl.code} onPress={() => onSelect(lvl.code)} activeOpacity={0.8} style={lp.cardWrap}>
                  <View style={[lp.card, { borderColor: active ? lvl.color : "#ede9e0" }, active && { backgroundColor: lvl.color + "12" }]}>
                    {active && (
                      <View style={[lp.check, { backgroundColor: lvl.color }]}>
                        <Ionicons name="checkmark" size={11} color="#fff" />
                      </View>
                    )}
                    <View style={[lp.iconCircle, { backgroundColor: lvl.color + "18" }]}>
                      <Ionicons name={lvl.icon} size={26} color={active ? lvl.color : "#94a3b8"} />
                    </View>
                    <Text style={[lp.code, { color: active ? lvl.color : "#0f172a" }]}>{lvl.code}</Text>
                    <Text style={[lp.name, { color: active ? lvl.color : "#64748b" }]}>{lvl.name.toUpperCase()}</Text>
                    <Text style={lp.desc}>{lvl.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={lp.hint}>Mund ta ndryshosh nivelin kur të duash</Text>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function PathScreen({ navigation }) {
  const { language } = useLanguage();
  const { user }     = useAuth();

  const [selectedLevel,   setSelectedLevel]   = useState(null);
  const [levelLocked,     setLevelLocked]     = useState(false);
  const [showPicker,      setShowPicker]      = useState(false);
  const [topics,          setTopics]          = useState([]);
  const [sectionTests,    setSectionTests]    = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [hearts,          setHearts]          = useState({ hearts: 3, isPaid: false, heartsResetsAt: null });
  const [nextHeartIn,     setNextHeartIn]     = useState(null);
  const [showHeartInfo,   setShowHeartInfo]   = useState(false);
  const [previewTopic,    setPreviewTopic]    = useState(null);
  const [sectionUsersMap, setSectionUsersMap] = useState({});

  const scrollViewRef      = useRef(null);
  const sectionYsRef       = useRef({});
  const shouldScrollRef    = useRef(false);
  const activeSectionNumRef = useRef(null);

  const handleSectionLayout = useCallback((sectionNum, y) => {
    sectionYsRef.current[sectionNum] = y;
    if (shouldScrollRef.current && activeSectionNumRef.current === sectionNum) {
      shouldScrollRef.current = false;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
      }, 100);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(LEVEL_KEY),
      AsyncStorage.getItem(LEVEL_LOCKED_KEY),
    ]).then(([saved, locked]) => {
      if (saved) {
        setSelectedLevel(saved);
        if (locked === "true") setLevelLocked(true);
      } else {
        setLoading(false);
        setShowPicker(true);
      }
    });
    api.get("/hearts").then((res) => {
      const d = res.data?.data || res.data;
      if (d) setHearts({ hearts: d.hearts ?? 3, isPaid: d.isPaid ?? false, heartsResetsAt: d.heartsResetsAt ?? null });
    }).catch(() => {});
  }, []);

  const handleSelectLevel = async (code) => {
    await AsyncStorage.setItem(LEVEL_KEY, code);
    await AsyncStorage.setItem(LEVEL_LOCKED_KEY, "true");
    setSelectedLevel(code);
    setLevelLocked(true);
    setShowPicker(false);
    // Sync level to user profile on server
    api.put("/users/profile", { level: code }).catch(() => {});
  };

  // Live countdown for next heart
  useEffect(() => {
    function calc() {
      if (hearts.isPaid || hearts.hearts >= 3 || !hearts.heartsResetsAt) {
        setNextHeartIn(null);
        return;
      }
      const diff = new Date(hearts.heartsResetsAt).getTime() - Date.now();
      if (diff <= 0) { setNextHeartIn(null); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setNextHeartIn(h > 0 ? `${h}h ${m}m` : `${m}m`);
    }
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [hearts]);

  const fetchTopics = useCallback(async () => {
    if (!selectedLevel) return;
    try {
      const res = await pathService.getAll({ level: selectedLevel, language });
      const data = res.data;
      const topicsArr = data?.topics ?? (Array.isArray(data) ? data : []);
      setTopics(topicsArr);
      setSectionTests(data?.sectionTests ?? []);

      // Fetch users per section (fire-and-forget, non-blocking)
      const secNums = [...new Set(topicsArr.map((t) => t.section || 1))];
      Promise.all(
        secNums.map((sec) =>
          pathService.getSectionUsers(selectedLevel, sec, language)
            .then((r) => {
              const users = Array.isArray(r.data?.data)
                ? r.data.data
                : Array.isArray(r.data)
                ? r.data
                : [];
              return { sec, users };
            })
            .catch((e) => {
              console.warn("section-users error sec=" + sec, e?.response?.data || e?.message);
              return { sec, users: [] };
            })
        )
      ).then((results) => {
        const map = {};
        results.forEach(({ sec, users }) => { map[sec] = users; });
        setSectionUsersMap(map);
      });
    } catch (e) {
      console.warn("PathScreen:", e?.message);
      setTopics([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedLevel, language]);

  useEffect(() => {
    if (selectedLevel) { setLoading(true); fetchTopics(); }
  }, [fetchTopics]);

  useFocusEffect(useCallback(() => {
    if (!selectedLevel) return;
    shouldScrollRef.current = true;
    fetchTopics();
    // Fallback: layout already measured (re-focus, data unchanged) — scroll after settle
    setTimeout(() => {
      if (!shouldScrollRef.current) return;
      const sec = activeSectionNumRef.current;
      const y   = sec !== null ? sectionYsRef.current[sec] : undefined;
      if (y !== undefined) {
        shouldScrollRef.current = false;
        scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
      }
    }, 400);
  }, [fetchTopics]));

  const topicsWithUnlock = topics.map((t, i) => ({
    ...t,
    _unlocked: i === 0 || (topics[i - 1].userProgress?.isCompleted ?? false),
  }));

  const activeIdx = topicsWithUnlock.findIndex(
    (t) => t._unlocked && !(t.userProgress?.isCompleted ?? false)
  );

  const sections = [];
  topicsWithUnlock.forEach((topic, i) => {
    const secNum   = topic.section || 1;
    const secTitle = topic.sectionTitle || `Seksioni ${secNum}`;
    let sec = sections.find((s) => s.num === secNum);
    if (!sec) {
      sec = {
        num: secNum,
        title: secTitle,
        sectionIcon: topic.sectionIcon || null,
        sectionIconFamily: topic.sectionIconFamily || null,
        topics: [],
      };
      sections.push(sec);
    }
    sec.topics.push({ ...topic, globalIdx: i });
  });
  sections.sort((a, b) => a.num - b.num);

  const handleTopicPress = (topic) => {
    setPreviewTopic(topic);
  };

  const handleStartFromPreview = (topic, curIdx) => {
    const totalEx = topic.userProgress?.totalExercises || topic.exercises?.length || 1;
    navigation.navigate("PathQuiz", {
      topicId:         topic._id,
      exerciseIndex:   curIdx,
      topicTitle:      topic.title,
      topicIcon:       topic.icon,
      topicIconFamily: topic.iconFamily || null,
      topicColor:      topic.color || levelData.color,
      totalExercises:  totalEx,
      language,
    });
  };

  const handleSectionTestPress = (secNum, secTitle) => {
    navigation.navigate("SectionTest", {
      level:        selectedLevel,
      sectionNum:   secNum,
      language,
      sectionTitle: secTitle,
    });
  };

  const levelData = LEVELS.find((l) => l.code === selectedLevel) || LEVELS[0];

  // Compute which section + unit the user is currently on
  let activeSectionNum = null;
  let activeUnitNum    = null;
  if (activeIdx >= 0) {
    sections.forEach((sec) => {
      const pos = sec.topics.findIndex((t) => t.globalIdx === activeIdx);
      if (pos !== -1) {
        activeSectionNum = sec.num;
        activeUnitNum    = pos + 1;
      }
    });
  }

  activeSectionNumRef.current = activeSectionNum;

  return (
    <View style={ms.root}>
      {/* ── Header ── */}
      {selectedLevel && (
        <View style={[ms.headerGrad, { backgroundColor: levelData.color + "12" }]}>
          <SafeAreaView edges={["top"]}>
            <View style={ms.headerRow}>

              {/* Header: level + hearts in one row */}
              <View style={[ms.levelCard, {
                backgroundColor: "transparent",
                borderColor: levelData.color + "30",
                borderBottomWidth: 4,
                borderBottomColor: levelData.color + "60",
                shadowColor: levelData.color,
                shadowOpacity: 0.3,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 5,
              }]}>
                <View style={[ms.levelIconCircle, { backgroundColor: levelData.color + "18", borderColor: levelData.color + "40" }]}>
                  <Ionicons name={levelData.icon} size={18} color={levelData.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={[ms.levelCodeTxt, { color: "#0f172a" }]}>{levelData.code}</Text>
                    <View style={[ms.levelDot, { backgroundColor: levelData.color + "70" }]} />
                    <Text style={[ms.levelNameTxt, { color: "#475569" }]}>{levelData.name}</Text>
                    {levelLocked && (
                      <View style={[ms.lockBadge, { backgroundColor: "#f1f5f9" }]}><Ionicons name="lock-closed" size={10} color="#94a3b8" /></View>
                    )}
                  </View>
                  {activeSectionNum !== null ? (
                    <View style={ms.unitRow}>
                      <Ionicons name="location-outline" size={10} color="#94a3b8" />
                      <Text style={[ms.unitTxt, { color: "#94a3b8" }]}>Seksioni {activeSectionNum} · Njësia {activeUnitNum}</Text>
                    </View>
                  ) : (
                    <Text style={[ms.unitTxt, { color: "#94a3b8" }]}>{levelData.desc}</Text>
                  )}
                </View>
                {/* Hearts */}
                <TouchableOpacity
                  style={ms.heartPill}
                  activeOpacity={0.75}
                  onPress={() => setShowHeartInfo(true)}
                >
                  {hearts.isPaid ? (
                    <>
                      {[0,1,2].map((i) => <Ionicons key={i} name="heart" size={13} color="#ef4444" />)}
                      <Text style={ms.infinityTxt}>∞</Text>
                    </>
                  ) : (
                    [0,1,2].map((i) => (
                      <Ionicons key={i}
                        name={i < hearts.hearts ? "heart" : "heart-outline"}
                        size={14}
                        color={i < hearts.hearts ? "#ef4444" : "#e2e8f0"}
                      />
                    ))
                  )}
                </TouchableOpacity>
              </View>

            </View>
          </SafeAreaView>
        </View>
      )}

      {/* ── Content ── */}
      {loading ? (
        <View style={ms.center}>
          <ActivityIndicator size="large" color={levelData.color} />
          <Text style={ms.loadingTxt}>Duke ngarkuar…</Text>
        </View>
      ) : topics.length === 0 && selectedLevel ? (
        <View style={ms.center}>
          <View style={ms.emptyIcon}>
            <Ionicons name="map-outline" size={40} color="#94a3b8" />
          </View>
          <Text style={ms.emptyTitle}>Nuk ka tema ende</Text>
          <Text style={ms.emptySub}>Nivel {selectedLevel} · shto tema nga admin</Text>
        </View>
      ) : selectedLevel ? (
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={ms.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchTopics(); }}
              tintColor={levelData.color}
            />
          }
        >
          <SnakePath
            sections={sections}
            sectionTests={sectionTests}
            activeIdx={activeIdx}
            levelColor={levelData.color}
            levelGrad={levelData.grad}
            onPress={handleTopicPress}
            onSectionTest={handleSectionTestPress}
            sectionUsersMap={sectionUsersMap}
            onSectionLayout={handleSectionLayout}
          />
          <View style={{ height: 60 }} />
        </ScrollView>
      ) : null}

      {/* ── Hearts overlay ── */}
      <Modal visible={showHeartInfo} transparent animationType="fade" onRequestClose={() => setShowHeartInfo(false)}>
        <TouchableOpacity style={ms.heartOverlayBg} activeOpacity={1} onPress={() => setShowHeartInfo(false)}>
          <View style={ms.heartOverlayCard}>
            <View style={ms.heartOverlayRow}>
              {[0,1,2].map((i) => (
                <Ionicons key={i}
                  name={i < hearts.hearts ? "heart" : "heart-outline"}
                  size={36}
                  color={i < hearts.hearts ? "#ef4444" : "#e2e8f0"}
                />
              ))}
            </View>
            <Text style={ms.heartOverlayCount}>{hearts.hearts} / 3 zemra</Text>

            {hearts.hearts >= 3 ? (
              <View style={ms.heartOverlayInfo}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                <Text style={ms.heartOverlayInfoTxt}>Zemrat janë plotë!</Text>
              </View>
            ) : nextHeartIn ? (
              <View style={ms.heartOverlayInfo}>
                <Ionicons name="time-outline" size={18} color="#f97316" />
                <Text style={ms.heartOverlayInfoTxt}>Zemra tjetër në <Text style={{ fontFamily: F.black, color: "#f97316" }}>{nextHeartIn}</Text></Text>
              </View>
            ) : (
              <View style={ms.heartOverlayInfo}>
                <Ionicons name="time-outline" size={18} color="#f97316" />
                <Text style={ms.heartOverlayInfoTxt}>Duke gjeneruar zemrën tjetër...</Text>
              </View>
            )}

            <Text style={ms.heartOverlaySub}>1 zemër çdo 6 orë</Text>

            <TouchableOpacity style={ms.heartOverlayClose} onPress={() => setShowHeartInfo(false)} activeOpacity={0.8}>
              <Text style={ms.heartOverlayCloseTxt}>Mbyll</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {!levelLocked && (
        <LevelPicker
          visible={showPicker}
          current={selectedLevel}
          onSelect={handleSelectLevel}
          onClose={() => levelLocked ? null : setShowPicker(false)}
        />
      )}

      {previewTopic && (
        <TopicPreviewSheet
          topic={previewTopic}
          levelColor={levelData.color}
          levelGrad={levelData.grad}
          onStart={handleStartFromPreview}
          onClose={() => setPreviewTopic(null)}
          isLocked={!previewTopic._unlocked}
        />
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const sb = StyleSheet.create({
  wrap: {
    marginHorizontal: 16, marginTop: 20, marginBottom: 8,
    borderRadius: 18,
    borderBottomWidth: 5, borderBottomColor: "rgba(0,0,0,0.20)",
    shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
    backgroundColor: "#000",
  },
  banner: {
    borderRadius: 18, padding: 16,
    flexDirection: "column", gap: 12,
    overflow: "hidden",
  },
  topRow:    { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox:   {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  iconEmoji: { fontSize: 20 },
  left:      { flex: 1 },
  label:     { fontSize: 10, fontFamily: F.xbold, color: "rgba(255,255,255,0.7)", letterSpacing: 1.5, marginBottom: 2 },
  title:     { fontSize: 16, fontFamily: F.black, color: "#fff" },
  right:     { alignItems: "flex-end", minWidth: 52 },
  pct:       { fontSize: 13, fontFamily: F.xbold, color: "#fff", marginBottom: 5 },
  barTrack:  { height: 4, width: 52, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2, overflow: "hidden" },
  barFill:   { height: 4, backgroundColor: "#fff", borderRadius: 2 },

  // Users row
  usersRow:      { flexDirection: "row", alignItems: "center", gap: 10,
                   paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)" },
  avatarStack:   { flexDirection: "row", alignItems: "center" },
  avatarWrap:    {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.6)",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  avatar:        { width: "100%", height: "100%" },
  avatarFallback:{ alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#fff", fontSize: 11, fontFamily: F.black },
  avatarExtra:   {
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  extraTxt:  { color: "#fff", fontSize: 9, fontFamily: F.black },
  usersTxt:  { color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: F.semi, flex: 1 },
});

const sn = StyleSheet.create({
  nodeWrap:    { alignItems: "center", paddingVertical: 10 },
  ringWrap:    {
    width: RING_SIZE, height: RING_SIZE + 7,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  nodeInner:   {
    width: NODE_SIZE, height: NODE_SIZE + 7,
    alignItems: "center",
  },
  glowRing:    {
    position: "absolute", top: -2,
    width: NODE_SIZE + 22, height: NODE_SIZE + 22,
    borderRadius: (NODE_SIZE + 22) / 2,
    borderWidth: 3, borderStyle: "dashed",
  },
  // shared base shape
  circle:      {
    width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
    alignItems: "center", justifyContent: "center",
  },
  // 3D depth layer — deeper offset, darker
  circle3d:    {
    position: "absolute", top: 7,
  },
  // Top (main) layer
  circleTop:   {
    shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 8,
    borderTopWidth: 2.5, borderTopColor: "rgba(255,255,255,0.65)",
    borderBottomWidth: 3.5, borderBottomColor: "rgba(0,0,0,0.18)",
  },
  circleActive:{ shadowOpacity: 0.45, shadowRadius: 18, elevation: 14 },
  numBadge:    {
    position: "absolute", top: 2, right: 2,
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2.5, borderColor: "#fff",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 4, elevation: 3,
  },
  numTxt:      { fontSize: 9, fontFamily: F.black, color: "#fff" },
  label:       {
    fontSize: 11, fontFamily: F.bold, color: "#1e293b",
    textAlign: "center", marginTop: 8, width: COL_W - 8, lineHeight: 15,
  },
  labelLocked: { color: "#94a3b8" },
  ctaBtn:      {
    marginTop: 8, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row", alignItems: "center", gap: 5,
    shadowOpacity: 0.45, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  ctaTxt:      { color: "#fff", fontSize: 11, fontFamily: F.black, letterSpacing: 0.5 },
});


const hc = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 8 + NODE_SIZE / 2 - 4,
    right: -COL_W / 2 + NODE_SIZE / 2 + 4,
    width: COL_W - NODE_SIZE - 8,
    flexDirection: "row", gap: 4,
    alignItems: "center", zIndex: -1,
  },
  dash: { height: 3, flex: 1, borderRadius: 2, opacity: 0.6 },
});

const tc2 = StyleSheet.create({
  wrap:      { marginHorizontal: 16, height: 32 },
  wrapRight: { alignItems: "flex-end" },
  wrapLeft:  { alignItems: "flex-start" },
  arm:       { borderRadius: 3 },
  armH:      { height: 3, width: COL_W * 0.5, opacity: 0.5 },
  armV:      { height: 26, width: 3, opacity: 0.5 },
});

const sr = StyleSheet.create({
  row:  { flexDirection: "row", paddingHorizontal: 16, alignItems: "flex-start" },
  cell: { alignItems: "center", position: "relative" },
});

const sp = StyleSheet.create({
  container: { paddingTop: 12 },
});

const lp = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: "#fffdf8",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 16,
    shadowColor: "#000", shadowOpacity: 0.16,
    shadowRadius: 24, elevation: 20,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#ede9e0",
    alignSelf: "center", marginTop: 12, marginBottom: 4,
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  iconBox:     { width: 44, height: 44, borderRadius: 14, backgroundColor: "#ede9ff", alignItems: "center", justifyContent: "center" },
  title:       { fontSize: 17, fontFamily: F.black, color: "#0f172a" },
  sub:         { fontSize: 12, fontFamily: F.semi, color: "#94a3b8", marginTop: 1 },
  closeBtn:    { width: 34, height: 34, borderRadius: 17, backgroundColor: "#f0ebe3", alignItems: "center", justifyContent: "center" },
  grid:        { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingTop: 4 },
  cardWrap:    { width: (width - 44) / 2 },
  card:        { borderRadius: 20, padding: 16, borderWidth: 2, backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  check:       { position: "absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  iconCircle:  { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  code:        { fontSize: 22, fontFamily: F.black, marginBottom: 2 },
  name:        { fontSize: 9, fontFamily: F.xbold, letterSpacing: 0.5, marginBottom: 4 },
  desc:        { fontSize: 11, fontFamily: F.regular, color: "#94a3b8", lineHeight: 15 },
  hint:        { textAlign: "center", color: "#c4bdb4", fontSize: 12, fontFamily: F.bold, paddingTop: 20, paddingBottom: 8 },
});

const ms = StyleSheet.create({
  root:       { flex: 1, backgroundColor: "#f8f5f0" },

  headerGrad: {
    shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  headerRow: {
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12, gap: 10,
  },
  // Level card
  levelCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 10, padding: 10,
    borderWidth: 1,
  },
  levelDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#cbd5e1" },
  levelIconCircle: {
    width: 36, height: 36, borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  levelCodeTxt: { fontSize: 14, fontFamily: F.black, color: "#0f172a" },
  levelNameTxt: { fontSize: 12, fontFamily: F.semi, color: "#475569" },
  unitRow:  { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  unitTxt:  { fontSize: 10, fontFamily: F.bold, color: "#94a3b8", letterSpacing: 0.2 },
  lockBadge: {
    backgroundColor: "#f1f5f9",
    borderRadius: 7, padding: 3,
  },

  // Hearts
  heartsBlock: {},
  heartPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#fff",
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  infinityTxt: { fontSize: 15, fontFamily: F.black, color: "#ef4444", marginLeft: 2 },
  heartOverlayBg: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  heartOverlayCard: {
    backgroundColor: "#fff", borderRadius: 28, padding: 28,
    alignItems: "center", width: width * 0.78,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 24, elevation: 16,
    gap: 12,
  },
  heartOverlayRow:      { flexDirection: "row", gap: 10, marginBottom: 4 },
  heartOverlayCount:    { fontSize: 22, fontFamily: F.black, color: "#0f172a" },
  heartOverlayInfo:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff7ed", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  heartOverlayInfoTxt:  { fontSize: 14, fontFamily: F.semi, color: "#0f172a" },
  heartOverlaySub:      { fontSize: 12, fontFamily: F.regular, color: "#94a3b8" },
  heartOverlayClose: {
    marginTop: 4, backgroundColor: "#f1f5f9", borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 32,
  },
  heartOverlayCloseTxt: { fontSize: 14, fontFamily: F.bold, color: "#64748b" },

  scrollContent:{ paddingTop: 4 },
  center:      { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  loadingTxt:  { fontSize: 13, fontFamily: F.semi, color: "#a3a099", marginTop: 4 },
  emptyIcon:   { width: 80, height: 80, borderRadius: 24, backgroundColor: "#f0ebe3", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle:  { fontSize: 18, fontFamily: F.xbold, color: "#0f172a", textAlign: "center" },
  emptySub:    { fontSize: 13, fontFamily: F.regular, color: "#94a3b8", textAlign: "center" },
});

const stn = StyleSheet.create({
  rowWrap:   { alignItems: "center", paddingVertical: 20 },
  wrap:      { alignItems: "center" },
  touchable: { alignItems: "center" },
  glowRing: {
    position: "absolute",
    width: 110, height: 110,
    borderRadius: 24,
    borderWidth: 3, borderStyle: "dashed", borderColor: "#34d399",
  },
  castleBox: {
    width: 88, height: 88, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  castleShadow: { position: "absolute", top: 7 },
  castleTop: {
    shadowColor: "#059669", shadowOpacity: 0.45, shadowRadius: 14,
    shadowOffset: { width: 0, height: 3 }, elevation: 10,
    borderTopWidth: 2.5, borderTopColor: "rgba(255,255,255,0.5)",
    borderBottomWidth: 4, borderBottomColor: "rgba(0,0,0,0.18)",
  },
  castleEmoji: { fontSize: 42 },
  labelWrap: {
    marginTop: 14, paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 12, borderWidth: 2,
  },
  labelTxt:  { fontSize: 11, fontFamily: F.black, letterSpacing: 0.5 },
});

const ps = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "flex-end",
  },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fffdf8",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 8,
    shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 20, elevation: 16,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#ede9e0", alignSelf: "center", marginBottom: 16,
  },
  closeBtn: {
    position: "absolute", top: 16, right: 16,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#f0ebe3", alignItems: "center", justifyContent: "center",
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  iconEmoji: { fontSize: 32 },
  title: { fontSize: 18, fontFamily: F.black, color: "#0f172a", marginBottom: 4 },
  desc:  { fontSize: 12, fontFamily: F.regular, color: "#64748b", lineHeight: 17 },
  progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  dotsRow: { flexDirection: "row", gap: 6 },
  dot: { width: 28, height: 8, borderRadius: 4 },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  badgeTxt: { fontSize: 13, fontFamily: F.black },
  barTrack: { height: 8, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden", marginBottom: 24 },
  barFill:  { height: 8, borderRadius: 4 },
  segRow: {
    flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 20,
  },
  seg: {
    flex: 1, height: 8, borderRadius: 4,
  },
  segCurrent: {
    height: 10, borderRadius: 5,
    shadowColor: "#eab308", shadowOpacity: 0.6, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  segLabel: {
    fontSize: 11, fontFamily: F.black, color: "#94a3b8", marginLeft: 8,
  },
  startBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 18,
    shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  startTxt: { fontSize: 17, fontFamily: F.black, color: "#fff" },
  lockedBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 18,
    backgroundColor: "#f1f5f9",
    borderWidth: 1.5, borderColor: "#e2e8f0",
    borderBottomWidth: 4, borderBottomColor: "#cbd5e1",
  },
  lockedTxt: { fontSize: 14, fontFamily: F.bold, color: "#94a3b8" },
});
