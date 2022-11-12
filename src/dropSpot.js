import { LightningElement, api, track } from "lwc";


export default class DropSpot extends LightningElement {
  @api index;
  @api size;
  @api position;
  @api gid;
  
  isDragOver = false;

  get isAllowedDrop() {
    return true
    //return this.position === 'before' ||
    //  (this.position === 'after' && this.index == this.size - 1)
  }

  get spotClass() {
    return !this.isDragOver ? 'slds-grid drop-child-spot' : 'slds-grid drop-child-spot drag'
  }
  get parentSpotClass() {
    return !this.isDragOver ? 'slds-grid drop-parent-spot' : 'slds-grid drop-parent-spot drag'
  }

  get connectionClass() {
    if ((this.position === 'after' && this.dropIndex != this.size) || (this.position === 'before' && this.size > 0))
     return 'connection-area';
    
    return '';
  }

  get dropIndex() {
    return (this.position === 'before') ? this.index : this.index + 1;
  }

  isValidDropTarget = (event) => {
    const dataIndex = this.getDataIndex(event)
    if (!dataIndex) return false;

    //console.log(`${dataIndex.groupId}:${this.gid} - ${dataIndex.index}:${this.dropIndex} ${dataIndex.index + 1}`)
    //console.log(dataIndex.groupId == this.gid && dataIndex.index == this.dropIndex ? 'T' : 'F')
    //console.log(dataIndex.groupId == this.gid && (dataIndex.index + 1) == this.dropIndex ? 'T' : 'F')

    if ((dataIndex.groupId == this.gid && dataIndex.index == this.dropIndex) ||
        (dataIndex.groupId == this.gid && dataIndex.index + 1 == this.dropIndex)) {
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
    } else {
     // console.log('not allowed')
      event.dataTransfer.dropEffect = 'none'
    }
  }

  // Handle Drag Leave Event
  onDragLeave = (event) => {
    this.isDragOver = false
  }

  // Handle Drop Event
  onDrop = (event) => {
    this.isDragOver = false

    if (this.isValidDropTarget(event)) {
      this.getTransferData(event).then((r) => {
        console.log(`move ${r.id}:${r.parentId} to ${this.dropIndex} in ${this.gid}`)
        const e = new CustomEvent('moverule', {
          detail: {
            groupId: r.parentId,
            id: r.id,
            moveGroupId: this.gid,
            moveIndex: this.dropIndex
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
          index: parseInt(idx[1]),
          groupId: idx[2],
          id: idx[3]
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