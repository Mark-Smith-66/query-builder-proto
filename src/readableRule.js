import { LightningElement, api, track } from "lwc";
import { mapOperator } from './queryUtils';

export default class ReadableRule extends LightningElement {
  @api rule
  @api parent

  // Is rule missing a trait?
  get emptyRule() {
    return !this.rule.trait;
  }

  // Rule Class
  get ruleClass() {
    return this.rule.parentId === 'root' ? 'rule root' : 'rule'
  }

  // Operator Class
  get operatorClass() {
    return !this.emptyRule && this.rule.operator ? 'operator' : 'error'
  }
  
  // Value Class
  get valueClass() {
    return !this.emptyRule && this.rule.value ? '' : 'error'
  }

  // Mapped Operator
  get operator() {
    let op = mapOperator(this.rule.operator)
    return op || '<missing operator>'
  }

   // True if Rule has following sibling
  get hasNextSibling() {
    let idx = this.parent.data.findIndex(o => o.id === this.rule.id)
    return idx !== -1 && idx < this.parent.data.length -1
  }
  
  // Mapped Group Operator
  get groupOperator() { 
    if (this.hasNextSibling) {
      return mapOperator(this.parent.operator)
    }
    return ''
  }

  // Mapped Values
  get values() {
    if (!this.rule.value) return '<missing values>'
    return  this.rule.value.map((v, i) => {
            const rv = v.split('^')
            return rv[0]
          }).join(', ')
  }
}