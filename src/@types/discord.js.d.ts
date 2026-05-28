import { Collection, Client as BaseClient, SlashCommandBuilder, CommandInteraction } from "discord.js";

export interface CommandModule {
  data: SlashCommandBuilder;
  execute: (client: BaseClient, interaction: CommandInteraction) => Promise<void>;
}

declare module "discord.js" {
  interface Client {
    commands: Collection<string, CommandModule>;
  }
}

declare module "*.md" {
  const content: string;
  export default content;
}
