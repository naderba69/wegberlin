import type { PublishedTargetedExamSimulation } from "@/types/exam";
import { targetedExamSimulations } from "./exam-simulations";
import { targetedListeningSimulations } from "./exam-listening-simulations";
import { targetedWritingSimulations } from "./exam-writing-simulations";
import { targetedChoiceSimulations } from "./exam-choice-simulations";
import { targetedSpeakingSimulations } from "./exam-speaking-simulations";
import { fullExam02Tasks } from "./full-exam-02-tasks";
import { fullExam03Tasks } from "./full-exam-03-tasks";
import { fullExam04Tasks } from "./full-exam-04-tasks";
import { fullExam05Tasks } from "./full-exam-05-tasks";
import { fullExam06Tasks } from "./full-exam-06-tasks";

export const allPublishedExamTasks: PublishedTargetedExamSimulation[] = [
  ...targetedExamSimulations,
  ...targetedListeningSimulations,
  ...targetedWritingSimulations,
  ...targetedChoiceSimulations,
  ...targetedSpeakingSimulations,
  ...fullExam02Tasks,
  ...fullExam03Tasks,
  ...fullExam04Tasks,
  ...fullExam05Tasks,
  ...fullExam06Tasks,
];

export const publishedTargetedExamSimulations = allPublishedExamTasks.filter(
  (simulation) => simulation.countTowardTargeted !== false,
);

export const publishedTargetedExamSimulationById = Object.fromEntries(
  allPublishedExamTasks.map((simulation) => [simulation.id, simulation]),
) as Record<string, PublishedTargetedExamSimulation>;
