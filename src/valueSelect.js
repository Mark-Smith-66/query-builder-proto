import { LightningElement, api, track } from "lwc";
export default class ValueSelect extends LightningElement {
  @api rule
  @api options
  @api allowmultiselect

  // Rendered Callback hook
  renderedCallback() {
    const s = this.template.querySelector(`[data-ruleid="${this.rule.id}"]`)

    // If no values are selected, unset any selected index on select
    if (this.rule.value === null) s.selectedIndex = -1
  }
  

  // Handle Value Changed Event
  onValueDidChange = (ex) => {
    // Get selected value options
    const opts = Array.from(ex.target.selectedOptions)

    // Construct values from selected value options
    const newopts = JSON.parse(JSON.stringify(this.options))
    const selectedOpts = []
    opts.forEach(o => {
      const no = newopts.find(p => p.name === o.innerHTML)
      if (no) selectedOpts.push(no.value)
    })
    
    // Emit event w/ selected values
    const e = new CustomEvent('valuechange', {
        detail: selectedOpts,
        bubbles: true,
        composed: true
      })
    this.dispatchEvent(e)
  }
}