import { LightningElement, api, track } from "lwc";

export default class Rule extends LightningElement {
  @api rule = {}
  @api parent = []
  @track vals = []
  @api index;
  @api isreadonly = false;
  @api scrollel

  selectElement = null

  // Rendered Callback hook
  renderedCallback() {
    const s = this.template.querySelector(`[data-id="${this.scrollel}"]`)
    if (s) {
      s.scrollIntoView()
    } 
  }

  // Is Draggable
  get isDraggable() {
    return !this.isreadonly
  }

  // Get class for connection area
  get connectionClass() {
    let r = 'connection-area'
    if (this.hasNextSibling()) r+= ' not-last-child'

    return r
  }

  // get rule wrapper class
  get ruleWrapperClass() {
    return `rule-wrapper ${this.isDraggable ? 'draggable' : ''}`
  }

  // Return if rule has no trait dropped in yet
  get emptyRule() {
    return this.rule.trait === null
  }

  // Get allowed operators for Rule
  get operators() {
    const ops = []

    if (this.rule.trait) {
      // Parse trait value/valueId pairs
      const vals = this.rule.trait.VAL_OPTS.split('|')
      ops.push({ name: '=', value: 'EQUALS', selected: false})
      ops.push({ name: '!=', value: 'NOT', selected: false})

      // If more than one value is selectable - add IN/NOT IN Operators
      if (vals.length > 1) {
        ops.push({ name: 'IN', value: 'IN', selected: false})
        ops.push({ name: 'NOT IN', value: 'NOT IN', selected: false})
      } 

      // Set the selected operator for this rule
      ops.forEach(o => {
        o.selected = this.rule.operator === o.value
      })
    }

    return ops
  }

  // Get the mapped selected operator value
  get selectedOperator() {
    return this.operators.find(o => o.value === this.rule.operator).name
  }

  // Get all allowed values for rule
  get allowedValues() {
    const valopts= []
    
    if (this.rule.trait) {
      // Get trait value/value_id pairs
      const vals = this.rule.trait.VAL_OPTS.split('|')

      // Add empty value
      valopts.push({name: '', value: '', selected: false})

      vals.forEach((v, idx) => {
        // Split to value/id and set as selected if exist in rule values
        const valPairs = v.split('^')
        valopts.push({ name: valPairs[0], value: v, selected: this.isSelected(v)})
      })
    }

    return valopts;
  }

  // IN/NOT in allows multi-select values - others are single select
  get allowMultiSelect() {
    return this.rule && this.rule.operator &&
      this.rule.operator.indexOf('IN') !== -1
  }

  // Selected Rule Values
  get selectedRuleValues() {
    let vals = ''
    if (this.rule.value) {
      vals = this.rule.value.map(v => {
        const rvPair = v.split('^')
        return rvPair[0]
      }).join(', ')
    }

    return vals
  }

  // Check if value/id exists in selected values for Rule
  isSelected = (v) => {
    if (this.rule.value) {
      const found = this.rule.value.find(val => val === v)
      return found ? true : false 
    }
    return false;
  }


  // True if Rule has following sibling
  hasNextSibling = () => {
    let idx = this.parent.data.findIndex(o => o.id === this.rule.id)
    return idx !== -1 && idx < this.parent.data.length -1
  }

  // Is a valid Drop Object
  isValidDropObject = (event) => {
    let dropItem = null
    for (const item of event.dataTransfer.items) {
       if (item.type === 'text/trait') dropItem = item;
    }

    return dropItem !== null
  }
  
  // Handle Drag Start/End
  onDragStart = (event) => {
    event.dataTransfer.effectAllowed = 'move'

    // Serialize selected trait and set as transfer data
    event.dataTransfer.setData('text/rule', JSON.stringify(this.rule))
    event.dataTransfer.setData(`index_${this.index}_${this.rule.parentId}_${this.rule.id}`, this.index);
  }


  // Handle drag
  onDrag = (event) => {
    // Use move icon vs copy icon
  }

  // Handle Drag Over event
  onDragOver = (event) => {
    event.preventDefault()

    // Set move cusor effect
    if (this.isValidDropObject(event))
      event.dataTransfer.dropEffect = 'move'
    else 
      event.dataTransfer.dropEffect = 'none'
  }

  // Handle Drag Enter Event
  onDragEnter = (event)=> {
    if (this.isValidDropObject(event)) {
      // Set move cusor effect
      // Use greenish background color to highlight area can be dropped into
      event.dataTransfer.dropEffect = 'move'
      event.currentTarget.style.backgroundColor = '#ddfbdd'
    } else {
      event.dataTransfer.dropEffect = 'none'
    }
  }

  // Handle Drag Leave Event
  onDragLeave = (event) => {
    // Revert to original background color
    event.currentTarget.style.backgroundColor = '#f0f3f5'
  }

  // Handle Drop Event
  onDrop = (event) => {
    if (this.isValidDropObject(event)) {
      event.currentTarget.style.backgroundColor = '#f0f3f5'

      this.getTransferData(event).then((trait) => {
        // Reconsitute dropped trait from event data
        //const trait = JSON.parse(event.dataTransfer.getData('text'))
        
        // Emit event w/ parent group/rule ID and trait
        const e = new CustomEvent('addtraittorule', {
          detail: {
            groupId: this.rule.parentId,
            id: this.rule.id,
            trait: trait
          },
          bubbles: true,
          composed: true
        })
        this.dispatchEvent(e)
      })
    }
  }
  
  // Handle Delete Rule Event
  deleteRule() {
    // Emit Event w/ group id to delete from and rule id to delete
    const e = new CustomEvent('deleterule', {
      detail: {
        gid: this.rule.parentId,
        id: this.rule.id
      },
      bubbles: true,
      composed: true
    })
    this.dispatchEvent(e)
  }

  // Handle Rule Operator Changed Event
  onOperatorChange = (ex) => {
    // Emit event with group id, rule id and operator value
    const e = new CustomEvent('ruleoperatorchange', {
        detail: {
          groupId: this.rule.parentId,
          id: this.rule.id,
          val: ex.target.value
        },
        bubbles: true,
        composed: true
      })
    this.dispatchEvent(e)
  }

  // Handle Rule Value change Event
  onValueChange = (ex) => {
    // Emit event with group id, rule id and selected value(s)
    const e = new CustomEvent('rulevaluechange', {
      detail: {
        groupId: this.rule.parentId,
        id: this.rule.id,
        val: ex.detail
      },
      bubbles: true,
      composed: true
    })
    this.dispatchEvent(e)

  }

  
  getTransferData = (event) => {
    return new Promise((resolve, reject) => {
      let traitData = null;
      for (const item of event.dataTransfer.items) {
        if (item.type === 'text/trait') {
         traitData = item
        }
      }

      if (traitData) {
        traitData.getAsString(t => {
          resolve(JSON.parse(t))
        })
      } else {
        reject();
      }
    })
  }
}