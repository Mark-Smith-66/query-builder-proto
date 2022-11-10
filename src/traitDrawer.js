
import traitmeta from './traitdata'
import { LightningElement, api, track } from "lwc";
export default class Rule extends LightningElement {
   categories = []
   allTraits = []
   dragTrait = null

   @track selectedCat;
   @track subCategories = new Set();
   @track selectedSubcat;
   @track traits = [];
   @track filterTerm = null;
   
   constructor() {
     super()

     traitmeta.forEach(t => {
       
       // Translate/map any trait meta data
       this.massageTraitData(t)
     })
     
     // Sort traits by Category, then Sub-Category, then ALIAS
     traitmeta.sort((a, b) => {

        const catCompare = a.CATEGORY.toUpperCase().localeCompare(b.CATEGORY.toUpperCase())
        if (catCompare !== 0) return catCompare
        const subCompare = a.SUB_CATEGORY.toUpperCase().localeCompare(
          b.SUB_CATEGORY.toUpperCase()
        )
        if (subCompare !== 0) return subCompare
        return a.ALIAS.toUpperCase().localeCompare(b.ALIAS.toUpperCase())
      })
      
      // Get Distinct categories
      traitmeta.forEach(t => {
        const cname = t.CATEGORY

        if (this.categories.findIndex(c => c.cat === cname) === -1) this.categories.push({ cat: cname })
      })
      this.allTraits = traitmeta
  }

  // Massage Category/Sub-Category names
  massageTraitData = (t) => {
    // Special values are sorted non-alphabetically
    const mapVal = (v) => {
      const vmap = [
        {v: 'YES', w: 'l'},
        {v: 'EXTREMELY LIKELY', w:  'a'},
        {v: 'HIGHLY LIKELY', w:  'b'},
        {v: 'VERY LIKELY', w:  'c'},
        {v: 'MORE THAN LIKELY', w:  'd'},
        {v: 'LIKELY', w: 'e'},
        {v: 'SOMEWHAT LIKELY', w:  'f'},
        {v: 'UNLIKELY', w: 'g'},
        {v: 'SOMEWHAT UNLIKELY', w:  'h'},
        {v: 'VERY UNLIKELY', w: 'i'},
        {v: 'HIGHLY UNLIKELY', w:  'j'},
        {v: 'EXTREMELY UNLIKELY', w:  'k'},
        {v: 'NO', w:  'm' }
      ]

      const weight = vmap.find(o => o.v === v.toUpperCase())
      return weight ? weight.w : v
    }

    // Money/Money Range values are sorted by initial value as int
    const compareMoney = (a, b) => {
      if (a.startsWith('$') && b.startsWith('$')) {
        const aval = a.split('-')[0].substring(1).replace('+', '')
        const bval = b.split('-')[0].substring(1).replace('+', '')
        return parseInt(aval)-parseInt(bval)
      }

      return 0
    }
    // TODO: map t.CATEGORY to user-friendly name
    if (!t.SUB_CATEGORY || t.SUB_CATEGORY === '' || t.SUB_CATEGORY === 'NULL')
          t.SUB_CATEGORY = '(none)'

    // Sort VAL_OPTS
    const vals = t.VAL_OPTS.split('|')
    vals.sort((a, b) => {
      let aval = a.split('^')[0];
      let bval = b.split('^')[0]
      const compareSpecial = compareMoney(aval, bval)
      if (compareSpecial !== 0) return compareSpecial;

      aval = mapVal(aval)
      bval = mapVal(bval)
      return aval.toUpperCase().localeCompare(bval)
    })

    t.VAL_OPTS = vals.join('|')
  }

  // Distinct Categories
  get allCategories() {
    return this.categories
  }

  // Get Directions to display
  get directions() {
    return this.traits.length > 0 ?
      'Drag a trait to any unfilled rule area to add...' :
      'Filter traits using above controls...'
  }

  // Handle Category Select
  onSelectCategory = (e) => {
    this.selectedCat = e.target.value;

    // Get Distinct sub-categories for selected category
    const subCats = new Set;
    this.allTraits.forEach(t => {
      if (t.CATEGORY === this.selectedCat) subCats.add(t.SUB_CATEGORY)
    })
    this.subCategories = subCats;

    // Reset any previously selected sub-category
    this.selectedSubcat = null;

    // Return traits for Category/Sub-Category (and potentially filter)
    this.getTraits();
  }

  // Handle Sub-Category select
  onSelectSubCategory = (e) => {
    this.selectedSubcat = e.target.value;

    // Return traits for Category/Sub-Category (and potentially filter)
    this.getTraits();
  }

  // Handle filter text change
  onFilterChange = (e) => {
    // Translate empty filter to null
    this.filterTerm = e.target.value.length > 0 ? e.target.value.toLowerCase() : null
    
    // Return traits for Category/Sub-Category (and potentially filter)
    this.getTraits()
  }

  // Return traits for Category/Sub-Category (and potentially filter)
  getTraits = () => {
    const newTraits = [];
    this.allTraits.forEach(t => {
       // If no category but filter term
       // or category matches selected category
       if ((!this.selectedCat && this.filterTerm) || (t.CATEGORY === this.selectedCat)) {
         
         // If no selected sub-category or sub-category matches selected sub-category
         if (!this.selectedSubcat || t.SUB_CATEGORY === this.selectedSubcat) {

           // If no filter term or alias contains filter term
           // Add trait as matched trait
          if (!this.filterTerm || t.ALIAS.toLowerCase().indexOf(this.filterTerm) !== -1) newTraits.push(t)
         }
       }
    })
    this.traits = newTraits;
  }

  // Handle Drag Start
  onDragStart = (e) => {
    // Serialize selected trait and set as transfer data
    const traitId = e.target.id.split('-')[0]
    const dragTrait = this.allTraits.find(t => t.TRAIT_ID == traitId)
    const dt = JSON.stringify(dragTrait)
    
    e.dataTransfer.setData('text/plain', dt)
    
  }

  // Handle drag
  onDrag = (e) =>{
    // Use move icon vs copy icon
    e.dataTransfer.effectAllowed = 'move'
  }
}