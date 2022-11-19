import { LightningElement, api, track } from "lwc";
import { mapOperator } from './queryUtils';

export default class ReadableGroup extends LightningElement {
  @api group
  @api parent

  // Is the root group
  get isRoot() {
    return this.group.id === 'root'
  }

  // Is Group empty - no children?
  get emptyGroup() {
    return this.group.data.length === 0
  }

  // Text to display for empty group
  get emptyGroupText() {
     return this.isRoot ? 'No Rules': '(No Rules in Group)'
  }
  
  // Group Class
  get groupClass() {
    return this.isRoot ? '' : 'group'
  }

  // Operator display Class
  get operatorClass() {
    return !this.emptyRule && this.rule.operator ? 'operator' : 'error'
  }
  
  // Value display class
  get valueClass() {
    return !this.emptyRule && this.rule.value ? '' : 'error'
  }
  
  // Does Group have a following sibling
  get hasNextSibling() {
    let idx = this.parent.data.findIndex(o => o.id === this.group.id)
    return idx !== -1 && idx < this.parent.data.length -1
  }

  // Mapped Operator for Group Children
  get operator() {
    if (this.hasNextSibling) {
      return mapOperator(this.parent.operator)
    }
    return ''
  }
}