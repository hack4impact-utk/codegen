import { model, Schema, Document, models, Model } from "mongoose";

const ExercisesSchema = new Schema(
  {
    day: {
      prop: [
        {
          _id: false,
          type: Schema.Types.ObjectId,
          required: false,
          ref: "FIGURE_OUT_REFS",
        },
      ],
    },
  },
  {
    versionKey: false,
  }
);

export interface ExercisesDocument extends Omit<Exercises, "_id">, Document {}

export default (models.Exercises as Model<ExercisesDocument>) ||
  model<ExercisesDocument>("Exercises", ExercisesSchema, "exercisess");
