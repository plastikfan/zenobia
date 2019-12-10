
export interface IArgumentBuilder {
  buildArguments (argumentsNode: Node): {};
}

export interface ICommandBuilder {
  buildNamedCommand (commandName: string, commandsNode: Node): {};
}

export interface IExpressionBuilder {

}
