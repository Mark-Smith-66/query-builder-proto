import { LightningElement, api, track } from "lwc";


export default class DropSpot extends LightningElement {
  @api index;
  @api size;
  @api position;
  @api gid;
  
  isDragOver = false;

  /* Getter for drop spot class */
  get spotClass() {
    return !this.isDragOver ? 'slds-grid drop-child-spot' : 'slds-grid drop-child-spot drag'
  }

  /* Getter for drop spot class */
  get spotContainerClass() {
    return !this.isDragOver ? 'slds-grid drop-parent-spot' : 'slds-grid drop-parent-spot drag'
  }

  /* Getter for connection class */
  get connectionClass() {
    if ((this.position === 'after' && this.dropIndex != this.size) || (this.position === 'before' && this.size > 0))
     return 'connection-area';
    
    return '';
  }

  // Get adjusted index in group to drop 
  // position 'before' is current index, 'after' is next index 
  get dropIndex() {
    return (this.position === 'before') ? this.index : this.index + 1;
  }

  // Parse drag information from dataTransfer to 
  // determine if this spot is valid for that element to be dropped in
  isValidDropTarget = (event) => {
    const dataIndex = this.getDataIndex(event)
    if (!dataIndex) return false;

    // Can't move group to self
    if (dataIndex.id === this.gid) return false;

    // Can't drop immediately before or after self in samne group (as this would keep you at same position)
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
    if (this.isValidDropTarget(event)) {
      this.isDragOver = true
    
      // Set move cusor effect
      event.dataTransfer.dropEffect = 'move'
    } else {
      // set 'not allowed' cursor effect
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
      const dataIndex = this.getDataIndex(event)
      const e = new CustomEvent('moverule', {
          detail: {
            groupId: dataIndex.groupId,
            id: dataIndex.id,
            moveGroupId: this.gid,
            moveIndex: this.dropIndex
          },
          bubbles: true,
          composed: true
        })
        this.dispatchEvent(e)
    }
  }

  // Parse dataTransfer data containing ids/index to move from (should be an array of 1)
  /* This is crude logic - can probably be done better
      valid droppable items have a type in the following format
      item_<current index>_<parent group id>_<item id>
  */
  getDataIndex = (event) => {
    // Should be an array
    for (const item of event.dataTransfer.items) {
      // Make sure it's a valid droppable item
      // 
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
}