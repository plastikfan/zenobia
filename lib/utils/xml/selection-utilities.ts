
import * as xpath from 'xpath';
import * as R from 'ramda';

export function selectFirst (query: string, contextNode: Node): xpath.SelectedValue {
  const nodeResult: xpath.SelectedValue = xpath.select(query, contextNode, true);

  return nodeResult;
}

export function collectLocalAttributes (contextNode: Node) {
  const attributeNodes = xpath.select('@*', contextNode);

  // Attribute nodes have name and value properties on them
  //
  const nvpair: any = R.props(['name', 'value']);
  const bag = R.fromPairs(R.map(nvpair, attributeNodes));

  return bag;
}

export function selectElementNodeById (elementName: string, id: string, name: string,
  parentNode: Node): xpath.SelectedValue {
  const elementResult = xpath.select(`.//${elementName}[@${id}="${name}"]`, parentNode, true);

  return elementResult;
}
