import {
  Atom, Award, Binary, Blocks, Bot, Brain, Braces, BookOpen, Bug, Calculator, Compass, Cpu, Crown,
  Database, Flag, Flame, Footprints, Gem, GitBranch, Globe, GraduationCap, Heart, Layers, Lightbulb,
  Map, Medal, Monitor, Mountain, Orbit, Palette, Puzzle, Rocket, Route, Server, Shield, Smartphone,
  Sparkles, Star, Swords, Target, Terminal, Trophy, Workflow, Wrench, Zap, CodeXml, Coffee,
} from "lucide-react";

// Curated icon set the teacher can choose from for levels, courses and achievements.
export const ICONS = {
  Sparkles, BookOpen, CodeXml, Terminal, Cpu, Brain, Lightbulb, Puzzle, Rocket, Globe, Database,
  Server, GitBranch, Layers, Palette, Braces, Binary, Blocks, Workflow, Atom, Bot, Calculator,
  Monitor, Smartphone, Wrench, Bug, Compass, Map, Route, Trophy, Medal, Award, Star, Flame, Zap,
  Target, Crown, Gem, Heart, Shield, Flag, Mountain, Swords, Footprints, Orbit, GraduationCap, Coffee,
};

export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name, ...props }) {
  const Cmp = ICONS[name] ?? Sparkles;
  return <Cmp {...props} />;
}
