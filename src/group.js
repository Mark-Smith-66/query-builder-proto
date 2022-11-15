import { LightningElement, api, track } from "lwc";


export default class Group extends LightningElement {
  @api grp = {}
  @api parent = []
  @api index = 0;
  @api isreadonly = false;

  // Return class for group
  get groupClass() {
   if (this.grp.id === 'root') return 'rule-group'
   const groupType = this.grp.odd ? 'group-odd' : 'group-even'
   return `rule-group ${groupType}`
  }

  // Determine if Delete allowed for group
  get allowDelete() {
    return this.grp.id !== 'root' && !this.isreadonly
  }

  // Is Draggable
  get isDraggable() {
    return this.grp.id !== 'root' && !this.isreadonly
  }

  // Get class for connection area
  get connectionClass() {
    let r = ''
    if (this.grp.id !== 'root') {
      r+= 'connection-area'
      if (this.hasNextSibling()) r+= ' not-last-child'
    }

    return r
  }

  // Get conditions allowed for Group
  get conditions() {
    const conds = []
    conds.push({ name: 'AND', value: 'INTERSECT', selected: false})
    conds.push({ name: 'OR', value: 'UNION', selected: false})
    conds.push({ name: 'SUBTRACT', value: 'MINUS', selected: false})
    
    // (Re)Set selected value for group
    conds.forEach(c => {
      c.selected = this.grp.operator === c.value
    })

    return conds
  }

  // Get selected condition
  get selectedCondition() {
    return this.conditions.find(c => c.value === this.grp.operator).name
  }

  // Does Group have a following sibling
  hasNextSibling() {
    let idx = this.parent.data.findIndex(o => o.id === this.grp.id)
    return idx !== -1 && idx < this.parent.data.length -1
  }

  // Handle Add Group Button click
  addGroup() {
    // Emit event w/ current Group ID
    const e = new CustomEvent('addgroup', {
      detail: this.grp.id,
      bubbles: true,
      composed: true
    })
    this.dispatchEvent(e)
  }

  // Handle Add Rule Button click
  addRule() {
    // Emit event w/ current Group ID
    const e = new CustomEvent('addrule', {
      detail: this.grp.id,
      bubbles: true,
      composed: true
    })
    this.dispatchEvent(e)
  }

  // Handle Group Delete icon click
  deleteGroup() {
    // Emit event with parent/group to delete from and current group id
    const e = new CustomEvent('deletegroup', {
      detail: {
        pid: this.grp.parentId,
        id: this.grp.id
      },
      bubbles: true,
      composed: true
    })
    this.dispatchEvent(e)
  }

  // Handle Conditions select value change
  onConditionChange = (ex) => {
    // Emit event w/ current group and selected condition value
    const e = new CustomEvent('ruleoperatorchange', {
        detail: {
          groupId: this.grp.id,
          val: ex.target.value
        },
        bubbles: true,
        composed: true
      })
    this.dispatchEvent(e)
  }
  
  // Handle Drag Start
  onDragStart = (event) => {
    let dragId = event.target.getAttribute('data-id')
    console.log(`${this.allowDelete} - ${dragId} : ${this.grp.id}`)
    if (this.allowDelete && dragId === this.grp.id) {
      event.dataTransfer.effectAllowed = 'move'
      console.log(`move ${this.grp.id} at ${this.index}`)
      // Serialize selected trait and set as transfer data
      event.dataTransfer.setData('text/rule', JSON.stringify(this.grp))
      event.dataTransfer.setData(`index_${this.index}_${this.grp.parentId}_${this.grp.id}`, this.index);
    }
  }
}
