import { LightningElement, api, track } from "lwc";

export default class ReadableGroup extends LightningElement {
  @api group
  @api parent

  get emptyGroup() {
    return this.group.data.length === 0
  }
  get emptyGroupText() {
     return this.isRoot ? 'No Rules': '(No Rules in Group)'
  }
  
  get groupClass() {
    return this.isRoot ? '' : 'group'
  }

  get isRoot() {
    return this.group.id === 'root'
  }

  get operatorClass() {
    return !this.emptyRule && this.rule.operator ? 'operator' : 'error'
  }
  
  get valueClass() {
    return !this.emptyRule && this.rule.value ? '' : 'error'
  }
  
  // Does Group have a following sibling
  get hasNextSibling() {
    let idx = this.parent.data.findIndex(o => o.id === this.group.id)
    return idx !== -1 && idx < this.parent.data.length -1
  }

  get operator() {
    if (this.hasNextSibling) {
      return this.mapOperator(this.parent.operator)
    }
    return ''
  }
  
  // TODO: Proper name/value mapping as needed by Data API
  mapOperator = (o) => {
    let op = o;
    if (o === 'INTERSECT') op = 'AND';
    else if (o === 'UNION') op = 'OR';
    else if (o === 'MINUS') op = 'SUBTRACT';
    else if (o === 'EQUALS') op = '=';
    else if (o === 'NOT') op = '!=';
    
    return op;
  }
}