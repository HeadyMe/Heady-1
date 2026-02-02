
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';

export interface NarrativeArc {
  id: string;
  goal: string;
  chapters: Chapter[];
  currentChapterIndex: number;
  status: 'planning' | 'in_progress' | 'resolution' | 'completed';
}

export interface Chapter {
  title: string;
  objectives: string[];
  status: 'pending' | 'active' | 'completed';
}

export class StoryDriverNode extends EventEmitter {
  private static instance: StoryDriverNode;
  private currentArc: NarrativeArc | null = null;

  private constructor() {
    super();
  }

  static getInstance(): StoryDriverNode {
    if (!StoryDriverNode.instance) {
      StoryDriverNode.instance = new StoryDriverNode();
    }
    return StoryDriverNode.instance;
  }

  /**
   * Initialize a new Narrative Arc (Session Goal)
   */
  initiateArc(goal: string): NarrativeArc {
    this.currentArc = {
      id: `arc-${Date.now()}`,
      goal,
      chapters: [],
      currentChapterIndex: 0,
      status: 'planning'
    };
    
    logger.info(`Story Driver: New Arc Initiated - "${goal}"`);
    this.emit('arc_started', this.currentArc);
    return this.currentArc;
  }

  /**
   * Define the chapters of the story
   */
  setChapters(titles: string[]) {
    if (!this.currentArc) throw new Error("No active arc");
    
    this.currentArc.chapters = titles.map(t => ({
      title: t,
      objectives: [],
      status: 'pending'
    }));
    
    this.currentArc.status = 'in_progress';
    this.currentArc.chapters[0].status = 'active';
    
    logger.info(`Story Driver: Chapters defined`, { count: titles.length });
    this.emit('chapters_set', this.currentArc);
  }

  /**
   * Advance the narrative based on system feedback
   */
  advance(success: boolean, feedback: string) {
    if (!this.currentArc) return;

    if (success) {
      const currentChapter = this.currentArc.chapters[this.currentArc.currentChapterIndex];
      currentChapter.status = 'completed';
      
      this.currentArc.currentChapterIndex++;
      
      if (this.currentArc.currentChapterIndex >= this.currentArc.chapters.length) {
        this.resolveArc("Success");
      } else {
        const nextChapter = this.currentArc.chapters[this.currentArc.currentChapterIndex];
        nextChapter.status = 'active';
        logger.info(`Story Driver: Advancing to Chapter ${this.currentArc.currentChapterIndex + 1}: ${nextChapter.title}`);
        this.emit('chapter_advanced', nextChapter);
      }
    } else {
      // Plot Twist / Conflict
      logger.warn(`Story Driver: Conflict detected - ${feedback}. Rerouting narrative.`);
      this.emit('narrative_conflict', { feedback });
    }
  }

  private resolveArc(conclusion: string) {
    if (!this.currentArc) return;
    this.currentArc.status = 'completed';
    logger.info(`Story Driver: Arc Resolved - ${conclusion}`);
    this.emit('arc_resolved', this.currentArc);
  }

  getCurrentContext() {
    return this.currentArc;
  }

  /**
   * Observe the system state via HeadyLens snapshot
   * This is the Feedback Loop input
   */
  observe(snapshot: any) {
    if (!this.currentArc || this.currentArc.status !== 'in_progress') return;

    const currentChapter = this.currentArc.chapters[this.currentArc.currentChapterIndex];
    if (!currentChapter || currentChapter.status !== 'active') return;

    // Simple Logic: Check if we are stuck (Narrative Stagnation)
    // In a real system, this would use LLM analysis of the snapshot vs objectives
    const errorComponent = snapshot.components.find((c: any) => c.status === 'error');
    
    if (errorComponent) {
        logger.warn(`Story Driver observed error in ${errorComponent.name}. Triggering conflict resolution.`);
        this.emit('narrative_conflict', { 
            reason: `Component ${errorComponent.name} is in error state`,
            snapshotId: snapshot.timestamp 
        });
    }
  }
}

export const storyDriver = StoryDriverNode.getInstance();
