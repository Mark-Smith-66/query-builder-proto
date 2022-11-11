import { LightningElement, api, track } from "lwc";


export default class DropSpot extends LightningElement {
  @api index;
  @api size;
  @api position;
  @api gid;
  
  isDragOver = false;

  get isAllowedDrop() {
    return this.position === 'before' ||
      (this.position === 'after' && this.index === this.size - 1)
  }

  get spotClass() {
    return !this.isDragOver ? 'slds-grid drop-child-spot' : 'slds-grid drop-child-spot drag'
  }

  get connectionClass() {
    return this.position === 'before' ? 'connection-area' : ''
  }

  get dropIndex() {
    return (this.position === 'before') ? this.index : this.index + 1;
  }

  isValidDropTarget = (event) => {
    const dataIndex = this.getDataIndex(event)
    if (!dataIndex) return false;

    //console.log(`${dataIndex}:${this.index}`)

    if ((dataIndex.groupId == this.gid && dataIndex.index == this.index) ||
        (dataIndex.groupId == this.gid && dataIndex.index + 1 == this.index)) {
        return false
    }
    
    return true
  }

  // Handle Drag Over event
  onDragOver = (event) => {
    event.preventDefault()
    
    if (this.isValidDropTarget(event))
      event.dataTransfer.dropEffect = 'move'
    else
      event.dataTransfer.dropEffect = 'none'
  }

  // Handle Drag Enter Event
  onDragEnter = (event) => {
    //console.log(`${this.getDataIndex(event)} ${this.index}`)
    // Set move cusor effect
    if (this.isValidDropTarget(event)) {
      this.isDragOver = true
      //console.log('allowed')
    
      // Set move cusor effect
      // Use greenish background color to highlight area can be dropped into
      event.dataTransfer.dropEffect = 'move'
      event.currentTarget.style.backgroundColor = '#ddfbdd'
      event.currentTarget.style.border = '1px dotted #000'
      event.currentTarget.style.borderRadius = '2px'
    } else {
     // console.log('not allowed')
      event.dataTransfer.dropEffect = 'none'
    }
  }

  // Handle Drag Leave Event
  onDragLeave = (event) => {
    this.isDragOver = false

    // Revert to original background color
    event.currentTarget.style.backgroundColor = 'transparent'
    event.currentTarget.style.border = 'none'
    event.currentTarget.style.borderRadius = 'none'
  }

  // Handle Drop Event
  onDrop = (event) => {
    this.isDragOver = false
    event.currentTarget.style.backgroundColor = 'transparent'
    event.currentTarget.style.border = 'none'
    event.currentTarget.style.borderRadius = 'none'

    if (this.isValidDropTarget(event)) {
      this.getTransferData(event).then((r) => {
        console.log(`move ${r.id}:${r.parentId} to ${this.index} in ${this.gid}`)
        const e = new CustomEvent('moverule', {
          detail: {
            groupId: r.parentId,
            id: r.id,
            moveGroupId: this.gid,
            moveIndex: this.position === 'after' ? this.index + 1 : this.index
          },
          bubbles: true,
          composed: true
        })
        this.dispatchEvent(e)
      })
    }
  }

  getDataIndex = (event) => {
    for (const item of event.dataTransfer.items) {
      if (item.type.startsWith('index')) {
        const idx = item.type.split('_')
        return {
          index: idx[1],
          groupId: idx[2]
        }
      }
    }

     return null;
  }
  getTransferData = (event) => {
    return new Promise((resolve, reject) => {
      let ruleItem = null;
      for (const item of event.dataTransfer.items) {
        if (item.type === 'text/rule') {
         ruleItem = item
        }
      }

      if (ruleItem) {
        ruleItem.getAsString(r => {
          resolve(JSON.parse(r))
        })
      } else {
        reject();
      }
    })
  }
}