(function () {
  const chai = require('chai');
  chai.use(require('dirty-chai'));
  const expect = chai.expect;
  const assert = chai.assert;

  const R = require('ramda');
  const DOMParser = require('xmldom').DOMParser;
  const parser = new DOMParser();

  const XHelpers = require('../../helpers/xml-test-helpers');
  const Helpers = require('../../helpers/test-helpers');
  const Builder = require('../../../lib/cli/builders/command-builder');

  const optionsMap = {
    'DEFAULT': { id: 'name' },
    'Command': { id: 'name', recurse: 'inherits', discards: ['inherits', 'abstract'] },
    'Tree': { id: 'alias' }
  };

  const getTestOptions = (el) => {
    return R.includes(el, R.keys(optionsMap)) ? optionsMap[el] : optionsMap['DEFAULT'];
  };

  const ComplexNormalisedArgumentDefs = {
    '_': 'ArgumentDefs',
    '_children': {
      'name': {
        'name': 'name',
        'alias': 'n',
        'optional': 'true',
        'describe': 'Album name',
        '_': 'Argument'
      },
      'incname': {
        'name': 'incname',
        'alias': 'in',
        'optional': 'true',
        'describe': 'Incorporation name',
        '_': 'Argument'
      },
      'studioname': {
        'name': 'studioname',
        'alias': 'sn',
        'optional': 'true',
        'describe': 'Studio name',
        '_': 'Argument'
      },
      'labelname': {
        'name': 'labelname',
        'alias': 'ln',
        'optional': 'true',
        'describe': 'Record label name',
        '_': 'Argument'
      },
      'header': {
        'name': 'header',
        'alias': 'hdr',
        'optional': 'true',
        'describe': 'Header, has no influence on the naming of content.',
        '_': 'Argument'
      },
      'producer': {
        'name': 'producer',
        'alias': 'pn',
        'optional': 'true',
        'describe': 'Producer name',
        '_': 'Argument'
      },
      'director': {
        'name': 'director',
        'alias': 'dn',
        'optional': 'true',
        'describe': 'Director name',
        '_': 'Argument'
      },
      'filesys': {
        'name': 'filesys',
        'alias': 'fs',
        'optional': 'true',
        'describe': 'The file system as defined in config as FileSystem',
        '_': 'Argument'
      },
      'path': {
        'name': 'path',
        'alias': 'p',
        'optional': 'true',
        'describe': 'Full path.',
        '_': 'Argument'
      },
      'tree': {
        'name': 'tree',
        'alias': 't',
        'optional': 'true',
        'describe': 'File system tree',
        '_': 'Argument'
      },
      'with': {
        'name': 'with',
        'alias': 'w',
        'optional': 'true',
        'describe': 'replace with',
        '_': 'Argument'
      },
      'put': {
        'name': 'put',
        'alias': 'pu',
        'optional': 'true',
        'describe': 'update existing',
        '_': 'Argument'
      },
      'loglevel': {
        'name': 'loglevel',
        'alias': 'll',
        'optional': 'true',
        'describe': 'the logging level',
        '_': 'Argument'
      },
      'logfile': {
        'name': 'logfile',
        'alias': 'lf',
        'optional': 'true',
        'describe': 'the file full path',
        '_': 'Argument'
      }
    }
  };

  describe('command-builder: normaliseCommand (single)', () => {
    context('given: a pre-built single command', () => {
      it('should: normalise the single simple command with no inheritance', () => {
        const argumentDefs = {
          'type': 'string',
          '_': 'Arguments',
          '_children': {
            'with': {
              'name': 'with',
              'alias': 'wi',
              'describe': 'New value.',
              '_': 'Argument'
            },
            'put': {
              'name': 'put',
              'alias': 'pu',
              'type': 'switch',
              'describe': "Insert new field if it doesn't exist. (Like put http verb)  switch.",
              '_': 'Argument'
            }
          }
        };

        // Pre normalised state, _children is an array instead of a map/dictionary
        //
        const preNormalised = [{
          'name': 'rename',
          'describe': 'Rename albums according to arguments specified (write).',
          '_': 'Command',
          '_children': [{
            '_': 'Arguments',
            '_children': [{
              'name': 'with',
              '_': 'ArgumentRef'
            }, {
              'name': 'put',
              '_': 'ArgumentRef'
            }]
          }]
        }];

        const normalised = Builder.normaliseCommands(preNormalised, {
          commandArguments: argumentDefs
        });

        const firstNormalised = normalised[0];

        expect(Helpers.logIfFailedStringify(R.where({
          name: R.equals('rename'),
          _: R.equals('Command'),
          describe: R.equals('Rename albums according to arguments specified (write).'),
          _children: R.is(Object)
        }, firstNormalised), normalised)).to.be.true();

        const normalisedArgs = R.path(['_children', 'Arguments'])(firstNormalised);

        if (normalisedArgs) {
          expect(normalisedArgs).to.have.all.keys('with', 'put');
        } else {
          Helpers.logIfFailedStringify(false, firstNormalised);
          assert.fail('Either "_children" or "_children/Arguments" is missing');
        }
      });

      it('should: normalise the single command with inheritance ok [COMPLEX]', () => {
        const preNormalised = [{ // RESULT OF Builder.buildNamedCommand
          'name': 'rename',
          'source': 'filesystem-source',
          '_': 'Command',
          '_children': [{
            '_': 'Arguments',
            '_children': [{
              'name': 'with',
              '_': 'ArgumentRef'
            }, {
              'name': 'put',
              '_': 'ArgumentRef'
            }]
          }, {
            '_': 'Arguments',
            '_children': [{
              'name': 'loglevel',
              '_': 'ArgumentRef'
            }, {
              'name': 'logfile',
              '_': 'ArgumentRef'
            }]
          }, {
            '_': 'ArgumentGroups',
            '_children': [{
              '_': 'Conflicts',
              '_children': [{
                'name': 'loglevel',
                '_': 'ArgumentRef'
              }, {
                'name': 'logfile',
                '_': 'ArgumentRef'
              }]
            }]
          }, {
            '_': 'Arguments',
            '_children': [{
              'name': 'name',
              '_': 'ArgumentRef'
            }, {
              'name': 'incname',
              '_': 'ArgumentRef'
            }, {
              'name': 'studioname',
              '_': 'ArgumentRef'
            }, {
              'name': 'labelname',
              '_': 'ArgumentRef'
            }, {
              'name': 'header',
              '_': 'ArgumentRef'
            }, {
              'name': 'producer',
              '_': 'ArgumentRef'
            }, {
              'name': 'director',
              '_': 'ArgumentRef'
            }]
          }, {
            '_': 'ArgumentGroups',
            '_children': [{
              '_': 'Conflicts',
              '_children': [{
                'name': 'name',
                '_': 'ArgumentRef'
              }, {
                'name': 'incname',
                '_': 'ArgumentRef'
              }]
            }, {
              '_': 'Implies',
              '_children': [{
                'name': 'studioname',
                '_': 'ArgumentRef'
              }, {
                'name': 'labelname',
                '_': 'ArgumentRef'
              }]
            }, {
              '_': 'Conflicts',
              '_children': [{
                'name': 'header',
                '_': 'ArgumentRef'
              }, {
                'name': 'producer',
                '_': 'ArgumentRef'
              }, {
                'name': 'director',
                '_': 'ArgumentRef'
              }]
            }]
          }, {
            '_': 'Arguments',
            '_children': [{
              'name': 'path',
              '_': 'ArgumentRef'
            }, {
              'name': 'filesys',
              '_': 'ArgumentRef'
            }, {
              'name': 'tree',
              '_': 'ArgumentRef'
            }]
          }],
          'describe': 'Rename albums according to arguments specified (write).'
        }];

        const normalised = Builder.normaliseCommands(preNormalised, {
          commandArguments: ComplexNormalisedArgumentDefs
        });

        const firstNormalised = normalised[0];

        expect(Helpers.logIfFailedStringify(R.where({
          name: R.equals('rename'),
          _: R.equals('Command'),
          describe: R.equals('Rename albums according to arguments specified (write).'),
          _children: R.is(Object)
        }, firstNormalised), normalised)).to.be.true();

        const normalisedArgs = R.path(['_children', 'Arguments'])(firstNormalised);

        if (normalisedArgs) {
          expect(normalisedArgs).to.have.all.keys(
            'with', 'put', 'loglevel', 'logfile', 'name', 'incname',
            'studioname', 'labelname', 'header', 'producer', 'director', 'path', 'filesys', 'tree');

          expect(R.path(['_children', 'ArgumentGroups'])(firstNormalised)).to.exist(
            `Either "_children" or "_children/ArgumentGroups" is missing: ${JSON.stringify(firstNormalised)}`
          );

          expect(R.where({
            'ArgumentGroups': R.is(Array)
          })(R.path(['_children'], firstNormalised))).to.be.true();
        } else {
          Helpers.logIfFailedStringify(false, firstNormalised);
          assert.fail('Either "_children" or "_children/Arguments" is missing');
        }
      });
    });
  }); // command-builder: normaliseCommand (single)

  describe('command-builder: buildNamedCommand (single)', () => {
    context('given: a command requested', () => {
      const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Cli>
            <Commands>
              <Command name="rename"
                describe="Rename albums according to arguments specified (write).">
                <Arguments>
                  <ArgumentRef name="with"/>
                  <ArgumentRef name="put"/>
                </Arguments>
              </Command>
            </Commands>
          </Cli>
        </Application>`;

      const document = parser.parseFromString(data);
      const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

      if (commandsNode) {
        const commands = Builder.buildNamedCommand('rename', commandsNode, getTestOptions);
        const renameCommand = commands[0];

        it('should: build a single command', () => {
          const noOfCommands = renameCommand['_children'].length;
          expect(noOfCommands).to.equal(1);
        });

        it('should: build single command', () => {
          const result = R.where({
            name: R.equals('rename'),
            _: R.equals('Command'),
            _children: R.is(Array)
          }, renameCommand);

          expect(result).to.be.true();
        });
      } else {
        assert.fail('Couldn\'t get Commands node.');
      }
    });

    context('given: a command with an unknown "name"', () => {
      it('should: throw', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="rename"
                  describe="Rename albums according to arguments specified (write).">
                  <Arguments>
                    <ArgumentRef name="with"/>
                    <ArgumentRef name="put"/>
                  </Arguments>
                </Command>
              </Commands>
            </Cli>
          </Application>`;

        const document = parser.parseFromString(data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          expect(() => {
            Builder.buildNamedCommand('unicorns', commandsNode, getTestOptions);
          }).to.throw();
        } else {
          assert.fail('Couldn\'t get Commands node.');
        }
      });
    });
  }); // command-builder: buildNamedCommand (single)

  describe('command-builder: buildCommands (deeper check)', () => {
    it('given: a rename command, inherits from 3 commands, ArgumentRefs and ArgumentGroups', () => {
      const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Cli>
            <Commands>
              <Command name="base-command" abstract="true" source="filesystem-source">
                <Arguments>
                  <ArgumentRef name="loglevel"/>
                  <ArgumentRef name="logfile"/>
                </Arguments>
              </Command>
              <Command name="domain-command" abstract="true">
                <Arguments>
                  <ArgumentRef name="name"/>
                  <ArgumentRef name="incname"/>
                  <ArgumentRef name="studioname"/>
                  <ArgumentRef name="labelname"/>
                  <ArgumentRef name="header"/>
                  <ArgumentRef name="producer"/>
                  <ArgumentRef name="director"/>
                </Arguments>
                <ArgumentGroups>
                  <Conflicts>
                    <ArgumentRef name="name"/>
                    <ArgumentRef name="incname"/>
                  </Conflicts>
                  <Implies>
                    <ArgumentRef name="studioname"/>
                    <ArgumentRef name="labelname"/>
                  </Implies>
                  <Conflicts>
                    <ArgumentRef name = "header"/>
                    <ArgumentRef name = "producer"/>
                    <ArgumentRef name = "director"/>
                  </Conflicts>
                </ArgumentGroups>
              </Command>
              <Command name="uni-command" abstract="true">
                <Arguments>
                  <ArgumentRef name="path"/>
                  <ArgumentRef name="filesys"/>
                  <ArgumentRef name="tree"/>
                </Arguments>
              </Command>
              <Command name="rename"
                describe="Rename albums according to arguments specified (write)."
                inherits="base-command,domain-command,uni-command">
                <Arguments>
                  <ArgumentRef name="with"/>
                  <ArgumentRef name="put"/>
                </Arguments>
              </Command>
            </Commands>
          </Cli>
        </Application>`;

      const document = parser.parseFromString(data);
      const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

      if (commandsNode) {
        const commands = Builder.buildCommands(commandsNode, getTestOptions);

        const renameCommand = commands[0];
        // console.log(`===> normalised rename COMMAND: ${JSON.stringify(renameCommand)}`);
        const children = renameCommand['_children'];

        context('given: a rename command, inherits from 3 commands, ArgumentRefs and ArgumentGroups', () => {
          it('should: return an object with all properties populated.', () => {
            const result = R.where({
              name: R.equals('rename'),
              source: R.equals('filesystem-source'),
              _: R.equals('Command'),
              _children: R.is(Array)
            }, renameCommand);

            expect(result).to.be.true();
          });
        });

        context('given: the children from the rename command', () => {
          it('should: return the correct number of children in array.', () => {
            const noChildren = children.length;
            expect(noChildren).to.be.equal(5);
          });
        });

        context('given: the collection of "Arguments" from rename command', () => {
          it('should: return the correct number of Arguments in array.', () => {
            const renameArguments = R.filter(R.whereEq({
              _: 'Arguments'
            }), children);
            const noRenameArguments = renameArguments.length;
            expect(noRenameArguments).to.be.equal(4);

            assert({
              given: 'the collection of "Arguments" from rename command',
              should: 'return the correct number of Arguments in array.',
              actual: noRenameArguments,
              expected: 4
            });
          });
        });

        context('given: the collection of "ArgumentGroups" from rename command', () => {
          it('should: return the correct number of ArgumentGroups in array.', () => {
            const renameArgumentGroups = R.filter(R.whereEq({
              _: 'ArgumentGroups'
            }), children);
            const noRenameArgumentGroups = renameArgumentGroups.length;

            expect(noRenameArgumentGroups).to.be.equal(1);
          });
        });
      } else {
        assert.fail('Couldn\'t get Commands node.');
      }
    });
  }); // command-builder: buildCommands (deeper check)

  describe('command-builder: buildCommands', () => {
    context('given: a command defined as abstract has a description', () => {
      it('should: throw', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="invalid-command" abstract="true"
                  describe="this description not permitted on abstract command">
                </Command>
              </Commands>
            </Cli>
          </Application>`;

        const document = parser.parseFromString(data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          expect(() => {
            Builder.buildCommands(commandsNode, getTestOptions);
          }).to.throw(Error);
        } else {
          assert.fail('Couldn\'t get Commands node.');
        }
      });
    });
  }); // command-builder: buildCommands

  describe('command-builder: normaliseCommands (deeper check)', () => {
    it('given: a rename command, inherits from 3 commands, ArgumentRefs and ArgumentGroups', () => {
      const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Cli>
            <Commands>
              <Command name="base-command" abstract="true" source="filesystem-source">
                <Arguments>
                  <ArgumentRef name="loglevel"/>
                  <ArgumentRef name="logfile"/>
                </Arguments>
                <ArgumentGroups>
                  <Conflicts>
                    <ArgumentRef name="loglevel"/>
                    <ArgumentRef name="logfile"/>
                  </Conflicts>
                </ArgumentGroups>
              </Command>
              <Command name="domain-command" abstract="true">
                <Arguments>
                  <ArgumentRef name="name"/>
                  <ArgumentRef name="labelname"/>
                  <ArgumentRef name="incname"/>
                  <ArgumentRef name="studioname"/>
                  <ArgumentRef name="header"/>
                  <ArgumentRef name="producer"/>
                  <ArgumentRef name="director"/>
                </Arguments>
                <ArgumentGroups>
                  <Conflicts>
                    <ArgumentRef name="name"/>
                    <ArgumentRef name="labelname"/>
                  </Conflicts>
                  <Implies>
                    <ArgumentRef name="incname"/>
                    <ArgumentRef name="studioname"/>
                  </Implies>
                  <Conflicts>
                    <ArgumentRef name = "header"/>
                    <ArgumentRef name = "producer"/>
                    <ArgumentRef name = "director"/>
                  </Conflicts>
                </ArgumentGroups>
              </Command>
              <Command name="uni-command" abstract="true">
                <Arguments>
                  <ArgumentRef name="path"/>
                  <ArgumentRef name="filesys"/>
                  <ArgumentRef name="tree"/>
                </Arguments>
              </Command>
              <Command name="rename"
                describe="Rename albums according to arguments specified (write)."
                inherits="base-command,domain-command,uni-command">
                <Arguments>
                  <ArgumentRef name="with"/>
                  <ArgumentRef name="put"/>
                </Arguments>
              </Command>
            </Commands>
          </Cli>
        </Application>`;

      const document = parser.parseFromString(data);
      const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

      if (commandsNode) {
        const commands = Builder.buildCommands(commandsNode, getTestOptions);
        const normalisedCommands = Builder.normaliseCommands(commands, {
          commandArguments: ComplexNormalisedArgumentDefs
        });
        const normalisedRenameCommand = normalisedCommands[0];
        // console.log(`===> Normalise Rename Command: ${JSON.stringify(normalisedRenameCommand)}`);

        context('given: a rename command, inherits from 3 commands, ArgumentRefs and ArgumentGroups', () => {
          it('should: return an object with children constituents normalised.', () => {
            const result = R.where({
              name: R.equals('rename'),
              source: R.equals('filesystem-source'),
              _: R.equals('Command'),
              _children: R.is(Object)
            }, normalisedRenameCommand);

            expect(result).to.be.true();
          });
        });

        context('given: a normalised command', () => {
          it('should: return the correct number of Argument\'s', () => {
            const commandArguments = R.path(['_children', 'Arguments'], normalisedRenameCommand);
            // console.log(`===> Normalise Rename Command arguments: ${JSON.stringify(commandArguments)}`);
            const argsLength = R.keys(commandArguments).length;
            expect(argsLength).to.be.equal(14);
          });

          it('should: return the correct number of ArgumentGroups\'s', () => {
            const argumentGroups = R.path(['_children', 'ArgumentGroups'], normalisedRenameCommand);
            // console.log(`===> Normalise Rename Command ArgumentGroups': ${JSON.stringify(argumentGroups)}`);
            const argGroupsLength = argumentGroups.length;

            expect(argGroupsLength).to.be.equal(4);
          });
        });
      } else {
        assert(Helpers.assertionFailure('Couldn\'t get Commands node.'));
      }
    });
  }); // command-builder: normaliseCommands (deeper check)

  describe('command-builder: normaliseCommands (deeper check) (resolveArguments) [COMPLEX]', () => {
    const data = `<?xml version="1.0"?>
      <Application name="pez">
        <Cli>
          <Commands>
            <Command name="base-command" abstract="true" source="filesystem-source">
              <Arguments>
                <ArgumentRef name="loglevel"/>
                <ArgumentRef name="logfile"/>
              </Arguments>
              <ArgumentGroups>
                <Conflicts>
                  <ArgumentRef name="loglevel"/>
                  <ArgumentRef name="logfile"/>
                </Conflicts>
              </ArgumentGroups>
            </Command>
            <Command name="domain-command" abstract="true">
              <Arguments>
                <ArgumentRef name="name"/>
                <ArgumentRef name="incname"/>
                <ArgumentRef name="studioname"/>
                <ArgumentRef name="labelname"/>
                <ArgumentRef name="header"/>
                <ArgumentRef name="producer"/>
                <ArgumentRef name="director"/>
              </Arguments>
              <ArgumentGroups>
                <Conflicts>
                  <ArgumentRef name="name"/>
                  <ArgumentRef name="incname"/>
                </Conflicts>
                <Implies>
                  <ArgumentRef name="studioname"/>
                  <ArgumentRef name="labelname"/>
                </Implies>
                <Conflicts>
                  <ArgumentRef name = "header"/>
                  <ArgumentRef name = "producer"/>
                  <ArgumentRef name = "director"/>
                </Conflicts>
              </ArgumentGroups>
            </Command>
            <Command name="uni-command" abstract="true">
              <Arguments>
                <ArgumentRef name="path"/>
                <ArgumentRef name="filesys"/>
                <ArgumentRef name="tree"/>
              </Arguments>
            </Command>
            <Command name="rename"
              describe="Rename albums according to arguments specified (write)."
              inherits="base-command,domain-command,uni-command">
              <Arguments>
                <ArgumentRef name="with"/>
                <ArgumentRef name="put"/>
              </Arguments>
            </Command>
          </Commands>
        </Cli>
      </Application>`;

    const document = parser.parseFromString(data);
    const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

    if (commandsNode) {
      context('given: a rename command, inherits from 3 commands, ArgumentRefs and ArgumentGroups', () => {
        it('should: return an object with children constituents normalised.', () => {
          const commands = Builder.buildCommands(commandsNode, getTestOptions);

          const normalisedCommands = Builder.normaliseCommands(commands, {
            commandArguments: ComplexNormalisedArgumentDefs
          });
          const normalisedRenameCommand = normalisedCommands[0];
          // console.log(`===> Normalise Rename Command: ${JSON.stringify(normalisedRenameCommand)}`);

          const result = R.where({
            name: R.equals('rename'),
            source: R.equals('filesystem-source'),
            _: R.equals('Command'),
            _children: R.is(Object)
          }, normalisedRenameCommand);

          expect(result).to.be.true();
        });
      });
    } else {
      assert.fail('Couldn\'t get Commands node.');
    }
  }); // command-builder: normaliseCommands (deeper check) (resolveArguments)
})();
