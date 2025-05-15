import pandas as pd
from ace_tools import display_dataframe_to_user

# Define the data with 50 tasks
pricing_data = [
    {"Task":"Drywall patching and repair","Unit":"per job","Handyman Low":200,"Handyman High":800,"Contractor Low":240,"Contractor High":900},
    {"Task":"Touch-up painting","Unit":"per room","Handyman Low":50,"Handyman High":150,"Contractor Low":60,"Contractor High":180},
    {"Task":"Door alignment and hinge repair","Unit":"per door","Handyman Low":50,"Handyman High":100,"Contractor Low":60,"Contractor High":120},
    {"Task":"Fixing squeaky doors or floors","Unit":"per room","Handyman Low":50,"Handyman High":100,"Contractor Low":60,"Contractor High":120},
    {"Task":"Caulking windows, tubs, and sinks","Unit":"per room","Handyman Low":175,"Handyman High":300,"Contractor Low":210,"Contractor High":360},
    {"Task":"Replacing weather stripping","Unit":"per door/window","Handyman Low":100,"Handyman High":400,"Contractor Low":120,"Contractor High":480},
    {"Task":"Replacing door knobs and locks","Unit":"per unit","Handyman Low":75,"Handyman High":200,"Contractor Low":90,"Contractor High":240},
    {"Task":"Tightening loose cabinet hardware","Unit":"per job","Handyman Low":20,"Handyman High":50,"Contractor Low":30,"Contractor High":60},
    {"Task":"Replacing window screens","Unit":"per screen","Handyman Low":15,"Handyman High":50,"Contractor Low":25,"Contractor High":70},
    {"Task":"Mounting TVs or soundbars","Unit":"per device","Handyman Low":100,"Handyman High":300,"Contractor Low":120,"Contractor High":360},
    {"Task":"Fixing leaky faucets","Unit":"per faucet","Handyman Low":65,"Handyman High":150,"Contractor Low":80,"Contractor High":190},
    {"Task":"Replacing showerheads","Unit":"per head","Handyman Low":75,"Handyman High":150,"Contractor Low":90,"Contractor High":190},
    {"Task":"Unclogging drains","Unit":"per drain","Handyman Low":100,"Handyman High":275,"Contractor Low":120,"Contractor High":330},
    {"Task":"Replacing toilets","Unit":"per unit","Handyman Low":175,"Handyman High":275,"Contractor Low":210,"Contractor High":330},
    {"Task":"Installing garbage disposals","Unit":"per unit","Handyman Low":80,"Handyman High":200,"Contractor Low":100,"Contractor High":240},
    {"Task":"Repairing toilet mechanisms","Unit":"per unit","Handyman Low":100,"Handyman High":310,"Contractor Low":120,"Contractor High":370},
    {"Task":"Replacing sink traps (P-traps)","Unit":"per trap","Handyman Low":100,"Handyman High":150,"Contractor Low":120,"Contractor High":190},
    {"Task":"Installing/replacing washing machine hoses","Unit":"per job","Handyman Low":50,"Handyman High":100,"Contractor Low":60,"Contractor High":130},
    {"Task":"Replacing light fixtures","Unit":"per fixture","Handyman Low":65,"Handyman High":175,"Contractor Low":80,"Contractor High":210},
    {"Task":"Replacing ceiling fans","Unit":"per fan","Handyman Low":200,"Handyman High":300,"Contractor Low":240,"Contractor High":360},
    {"Task":"Swapping out switches or outlets","Unit":"per unit","Handyman Low":50,"Handyman High":150,"Contractor Low":60,"Contractor High":180},
    {"Task":"Installing dimmers or timers","Unit":"per unit","Handyman Low":60,"Handyman High":150,"Contractor Low":80,"Contractor High":180},
    {"Task":"Replacing smoke or CO detectors","Unit":"per unit","Handyman Low":50,"Handyman High":100,"Contractor Low":60,"Contractor High":130},
    {"Task":"Installing doorbells or chimes","Unit":"per unit","Handyman Low":50,"Handyman High":100,"Contractor Low":60,"Contractor High":130},
    {"Task":"Replacing bathroom exhaust fans","Unit":"per fan","Handyman Low":175,"Handyman High":550,"Contractor Low":210,"Contractor High":660},
    {"Task":"Gutter cleaning","Unit":"per story","Handyman Low":100,"Handyman High":225,"Contractor Low":120,"Contractor High":270},
    {"Task":"Power washing siding or walkways","Unit":"per job","Handyman Low":150,"Handyman High":300,"Contractor Low":180,"Contractor High":360},
    {"Task":"Fence repair","Unit":"per section","Handyman Low":300,"Handyman High":800,"Contractor Low":360,"Contractor High":960},
    {"Task":"Deck repair or staining","Unit":"per job","Handyman Low":450,"Handyman High":1500,"Contractor Low":550,"Contractor High":1800},
    {"Task":"Replacing rotten trim or siding","Unit":"per job","Handyman Low":200,"Handyman High":600,"Contractor Low":250,"Contractor High":800},
    {"Task":"Minor roof patching (shingle)","Unit":"per job","Handyman Low":200,"Handyman High":800,"Contractor Low":250,"Contractor High":900},
    {"Task":"Installing downspout extensions","Unit":"per unit","Handyman Low":50,"Handyman High":100,"Contractor Low":60,"Contractor High":130},
    {"Task":"Hanging holiday lights","Unit":"per house","Handyman Low":220,"Handyman High":680,"Contractor Low":260,"Contractor High":780},
    {"Task":"Building or assembling furniture","Unit":"per piece","Handyman Low":85,"Handyman High":200,"Contractor Low":110,"Contractor High":260},
    {"Task":"Installing or repairing baseboards and trim","Unit":"per job","Handyman Low":200,"Handyman High":800,"Contractor Low":250,"Contractor High":1000},
    {"Task":"Replacing cabinet doors","Unit":"per door","Handyman Low":50,"Handyman High":200,"Contractor Low":70,"Contractor High":250},
    {"Task":"Building closet organizers or shelves","Unit":"per closet","Handyman Low":200,"Handyman High":800,"Contractor Low":250,"Contractor High":900},
    {"Task":"Repairing stairs or railings","Unit":"per job","Handyman Low":200,"Handyman High":600,"Contractor Low":250,"Contractor High":700},
    {"Task":"Installing pet doors","Unit":"per door","Handyman Low":200,"Handyman High":450,"Contractor Low":250,"Contractor High":550},
    {"Task":"Installing vinyl or laminate flooring","Unit":"per job","Handyman Low":1000,"Handyman High":4000,"Contractor Low":1200,"Contractor High":4800},
    {"Task":"Repairing tile grout","Unit":"per job","Handyman Low":250,"Handyman High":1000,"Contractor Low":300,"Contractor High":1200},
    {"Task":"Re-caulking shower/tub joints","Unit":"per unit","Handyman Low":175,"Handyman High":300,"Contractor Low":210,"Contractor High":360},
    {"Task":"Repairing or replacing threshold transitions","Unit":"per unit","Handyman Low":100,"Handyman High":300,"Contractor Low":120,"Contractor High":400},
    {"Task":"Installing blinds or curtain rods","Unit":"per window","Handyman Low":30,"Handyman High":250,"Contractor Low":50,"Contractor High":300},
    {"Task":"Replacing mailboxes","Unit":"per box","Handyman Low":150,"Handyman High":200,"Contractor Low":180,"Contractor High":260},
    {"Task":"Installing baby gates or childproofing","Unit":"per home","Handyman Low":200,"Handyman High":700,"Contractor Low":250,"Contractor High":800},
    {"Task":"Assembling playsets or sheds","Unit":"per unit","Handyman Low":200,"Handyman High":1000,"Contractor Low":250,"Contractor High":1200},
    {"Task":"Moving appliances or heavy furniture","Unit":"per job","Handyman Low":700,"Handyman High":1500,"Contractor Low":800,"Contractor High":1800},
    {"Task":"Installing or replacing thermostats","Unit":"per unit","Handyman Low":80,"Handyman High":200,"Contractor Low":100,"Contractor High":240}
]

# Create DataFrame
df = pd.DataFrame(pricing_data)

# Add formatted price range columns for display
df["Handyman Price Range"] = df.apply(lambda row: f"${row['Handyman Low']}–${row['Handyman High']}", axis=1)
df["Contractor Price Range"] = df.apply(lambda row: f"${row['Contractor Low']}–${row['Contractor High']}", axis=1)

# Select columns for display
display_df = df[["Task", "Unit", "Handyman Price Range", "Contractor Price Range"]]

# Display the DataFrame to the user
display_dataframe_to_user(name="Denver Metro Handyman Pricing", dataframe=display_df)

# Optionally save to CSV
df.to_csv('handyman_pricing.csv', index=False)
